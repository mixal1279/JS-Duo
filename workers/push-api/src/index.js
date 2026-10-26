const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", ...headers },
});
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const unb64u = (value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));
const utf8 = (value) => new TextEncoder().encode(value);
const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
};
const hmac = async (keyBytes, data) => {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
};
const hkdfExpand = async (prk, info, length) => {
  let output = new Uint8Array(0), previous = new Uint8Array(0), counter = 1;
  while (output.length < length) {
    previous = await hmac(prk, concat(previous, info, new Uint8Array([counter++])));
    output = concat(output, previous);
  }
  return output.slice(0, length);
};
const sha256 = async (bytes) => new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
async function keyFor(endpoint) {
  const digest = await sha256(utf8(endpoint));
  return "sub:" + Array.from(digest, b => b.toString(16).padStart(2, "0")).join("");
}
function validSubscription(value) {
  if (!value || typeof value.endpoint !== "string" || value.endpoint.length > 4096) return false;
  try { if (new URL(value.endpoint).protocol !== "https:") return false; } catch { return false; }
  return !!value.keys && typeof value.keys.p256dh === "string" && typeof value.keys.auth === "string" &&
    value.keys.p256dh.length < 512 && value.keys.auth.length < 512;
}
function cors(request, env) {
  const origin = request.headers.get("Origin");
  return {
    "access-control-allow-origin": origin === env.ALLOWED_ORIGIN ? origin : "null",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}
function admin(request, env) {
  return !!env.ADMIN_TOKEN && request.headers.get("Authorization") === "Bearer " + env.ADMIN_TOKEN;
}
async function vapidToken(endpoint, env) {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64u(utf8(JSON.stringify({ aud: audience, exp: now + 12 * 60 * 60, sub: env.VAPID_SUBJECT })));
  const unsigned = header + "." + payload;
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(unsigned));
  return unsigned + "." + b64u(signature);
}
async function encryptPayload(subscription, payload) {
  const clientPublic = unb64u(subscription.keys.p256dh);
  const authSecret = unb64u(subscription.keys.auth);
  const clientKey = await crypto.subtle.importKey("raw", clientPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256));
  const authPrk = await hmac(authSecret, sharedSecret);
  const keyInfo = concat(utf8("WebPush: info\0"), clientPublic, serverPublic);
  const inputKeyMaterial = await hkdfExpand(authPrk, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, inputKeyMaterial);
  const cek = await hkdfExpand(prk, utf8("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, utf8("Content-Encoding: nonce\0"), 12);
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const plaintext = concat(utf8(JSON.stringify(payload)), new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, aesKey, plaintext));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return concat(salt, rs, new Uint8Array([serverPublic.length]), serverPublic, ciphertext);
}
async function sendPush(subscription, payload, env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_JWK || !env.VAPID_SUBJECT) throw new Error("VAPID is not configured");
  const body = await encryptPayload(subscription, payload);
  const token = await vapidToken(subscription.endpoint, env);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "authorization": "vapid t=" + token + ", k=" + env.VAPID_PUBLIC_KEY,
      "content-encoding": "aes128gcm",
      "content-type": "application/octet-stream",
      "ttl": "3600",
      "urgency": "normal",
    },
    body,
  });
  if (!response.ok) {
    const error = new Error("Push service returned HTTP " + response.status);
    error.statusCode = response.status;
    throw error;
  }
}
function localDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(p => [p.type, p.value]));
}

function isValidReminderTime(value) {
  return typeof value === "string" && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}

function dailyScheduleStatus(record, date) {
  const tz = typeof record.preferences.timezone === "string" ? record.preferences.timezone : "UTC";
  let local;
  try { local = localDateParts(date, tz); } catch { local = localDateParts(date, "UTC"); }
  const localDate = local.year + "-" + local.month + "-" + local.day;
  const currentMinute = Number(local.hour) * 60 + Number(local.minute);
  const targetTime = isValidReminderTime(record.preferences.time) ? record.preferences.time : "18:00";
  const [targetHour, targetMinutePart] = targetTime.split(":").map(Number);
  const targetMinute = targetHour * 60 + targetMinutePart;
  const delta = (currentMinute - targetMinute + 1440) % 1440;
  return {
    timezone: tz,
    localDate,
    localTime: local.hour + ":" + local.minute,
    targetTime,
    eligible: delta < 15 && record.lastDailyDate !== localDate,
    alreadySentToday: record.lastDailyDate === localDate,
    minutesSinceTarget: delta,
  };
}

export { dailyScheduleStatus, isValidReminderTime };

function dailyMessage(record) {
  const streak = Math.max(0, Number(record.preferences.streak) || 0);
  const tone = record.preferences.tone;
  if (tone === "strict") return { title: "⏰ Czas na lekcję!", body: "Twój streak wynosi " + streak + " dni. Zrób dzisiejszą sesję, zanim minie północ." };
  if (tone === "coder") return { title: "🚀 const streak = " + streak + ";", body: "Czas na krótki sprint kodowania. Utrzymaj branch wiedzy w zielonym stanie." };
  return { title: "🦉 Czas na codzienną dawkę JavaScriptu!", body: "Utrzymaj swoją passę " + streak + " dni. Trzy minuty dzielą Cię od kolejnego poziomu." };
}
function inactivityMessage(record) {
  const streak = Math.max(0, Number(record.preferences.streak) || 0);
  if (record.preferences.tone === "strict") return { title: "⚠️ Twój streak wisi na włosku!", body: "Minęły 24 godziny bez nauki. Rozwiąż jedną lekcję, aby chronić passę " + streak + " dni." };
  if (record.preferences.tone === "coder") return { title: "💻 ERR_IDLE_TIMEOUT", body: "24h bez sesji JS. Wznów pętlę i utrzymaj streak " + streak + "." };
  return { title: "🦉 Sowa JS Duo tęskni!", body: "Nie było Cię od 24 godzin. Wróć na 3 minuty i uratuj swoją passę." };
}
async function deliver(env, key, record, payload) {
  try {
    await sendPush(record.subscription, {
      ...payload,
      icon: env.ALLOWED_ORIGIN + "/JS-Duo/favicon.png",
      badge: env.ALLOWED_ORIGIN + "/JS-Duo/favicon.png",
      tag: payload.tag || "js-duo-reminder",
      url: env.ALLOWED_ORIGIN + "/JS-Duo/",
    }, env);
    return true;
  } catch (error) {
    if (error && (error.statusCode === 404 || error.statusCode === 410)) await env.PUSH_SUBSCRIPTIONS.delete(key);
    return false;
  }
}
async function scheduledRun(env) {
  let cursor;
  let processed = 0;
  do {
    const page = await env.PUSH_SUBSCRIPTIONS.list({ prefix: "sub:", cursor, limit: 1000 });
    for (const item of page.keys) {
      const raw = await env.PUSH_SUBSCRIPTIONS.get(item.name);
      if (!raw) continue;
      let record;
      try { record = JSON.parse(raw); } catch { await env.PUSH_SUBSCRIPTIONS.delete(item.name); continue; }
      if (!record.subscription || !record.preferences || !record.preferences.enabled) continue;
      const now = new Date();
      const dailyStatus = dailyScheduleStatus(record, now);
      const localDate = dailyStatus.localDate;
      if (dailyStatus.eligible) {
        const sent = await deliver(env, item.name, record, { ...dailyMessage(record), tag: "js-duo-daily-reminder" });
        if (sent) {
          record.lastDailyDate = localDate;
          await env.PUSH_SUBSCRIPTIONS.put(item.name, JSON.stringify(record), { expirationTtl: 31536000 });
        }
      }
      const lastActivity = Number(record.lastActivityAt) || Number(record.createdAt) || now.getTime();
      if (now.getTime() - lastActivity >= 86400000 && Number(record.lastInactivityAt || 0) < lastActivity) {
        const sent = await deliver(env, item.name, record, { ...inactivityMessage(record), tag: "js-duo-inactivity-reminder" });
        if (sent) {
          record.lastInactivityAt = now.getTime();
          await env.PUSH_SUBSCRIPTIONS.put(item.name, JSON.stringify(record), { expirationTtl: 31536000 });
        }
      }
      processed++;
    }
    cursor = page.cursor;
    if (!page.list_complete) continue;
    break;
  } while (cursor && processed < 5000);
}
export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const origin = request.headers.get("Origin");
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403, headers);
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "js-duo-push-api" }, 200, headers);
      if (request.method === "GET" && url.pathname === "/vapid-public-key") return env.VAPID_PUBLIC_KEY ? json({ publicKey: env.VAPID_PUBLIC_KEY }, 200, headers) : json({ error: "Push is not configured" }, 503, headers);
      if (request.method !== "POST") return json({ error: "Not found" }, 404, headers);
      if (url.pathname !== "/send-test" && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origin required" }, 403, headers);
      const body = await request.json();
      if (url.pathname === "/subscribe") {
        if (!validSubscription(body.subscription)) return json({ error: "Invalid Web Push subscription" }, 400, headers);
        const key = await keyFor(body.subscription.endpoint);
        const existingRaw = await env.PUSH_SUBSCRIPTIONS.get(key);
        let existing = existingRaw ? JSON.parse(existingRaw) : {};
        const prefs = body.preferences && typeof body.preferences === "object" ? body.preferences : {};
        const preferences = {
          enabled: prefs.enabled !== false,
          time: isValidReminderTime(prefs.time) ? prefs.time : "18:00",
          tone: ["friendly", "coder", "strict"].includes(prefs.tone) ? prefs.tone : "friendly",
          streak: Math.max(0, Math.min(100000, Number(prefs.streak) || 0)),
          timezone: typeof prefs.timezone === "string" && prefs.timezone.length < 100 ? prefs.timezone : "UTC",
        };
        const record = {
          subscription: body.subscription,
          preferences,
          createdAt: Number(existing.createdAt) || Date.now(),
          lastActivityAt: Number(existing.lastActivityAt) || Date.now(),
          lastDailyDate: existing.lastDailyDate || "",
          lastInactivityAt: Number(existing.lastInactivityAt) || 0,
          lastTestAt: Number(existing.lastTestAt) || 0,
        };
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(record), { expirationTtl: 31536000 });
        return json({ ok: true }, existingRaw ? 200 : 201, headers);
      }
      if (url.pathname === "/preferences") {
        if (typeof body.endpoint !== "string") return json({ error: "endpoint is required" }, 400, headers);
        const key = await keyFor(body.endpoint);
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!raw) return json({ error: "Subscription not found" }, 404, headers);
        const record = JSON.parse(raw);
        const p = body.preferences || {};
        record.preferences = {
          ...record.preferences,
          enabled: p.enabled !== false,
          time: isValidReminderTime(p.time) ? p.time : record.preferences.time,
          tone: ["friendly", "coder", "strict"].includes(p.tone) ? p.tone : record.preferences.tone,
          streak: Math.max(0, Math.min(100000, Number(p.streak) || 0)),
          timezone: typeof p.timezone === "string" && p.timezone.length < 100 ? p.timezone : record.preferences.timezone,
        };
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(record), { expirationTtl: 31536000 });
        return json({ ok: true }, 200, headers);
      }
      if (url.pathname === "/activity") {
        if (typeof body.endpoint !== "string" || !Number.isFinite(Number(body.lastActivityAt))) return json({ error: "Invalid activity" }, 400, headers);
        const key = await keyFor(body.endpoint);
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!raw) return json({ error: "Subscription not found" }, 404, headers);
        const record = JSON.parse(raw);
        record.lastActivityAt = Math.min(Date.now(), Number(body.lastActivityAt));
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(record), { expirationTtl: 31536000 });
        return json({ ok: true }, 200, headers);
      }
      if (url.pathname === "/unsubscribe") {
        if (typeof body.endpoint !== "string" || body.endpoint.length > 4096) return json({ error: "Invalid endpoint" }, 400, headers);
        await env.PUSH_SUBSCRIPTIONS.delete(await keyFor(body.endpoint));
        return json({ ok: true }, 200, headers);
      }
      if (url.pathname === "/test") {
        if (typeof body.endpoint !== "string") return json({ error: "endpoint is required" }, 400, headers);
        const key = await keyFor(body.endpoint);
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!raw) return json({ error: "Subscription not found" }, 404, headers);
        const record = JSON.parse(raw);
        if (Date.now() - Number(record.lastTestAt || 0) < 60000) return json({ error: "Wait one minute before testing again" }, 429, headers);
        const sent = await deliver(env, key, record, { title: "JS Duo — test powiadomień", body: "Jeśli widzisz ten alert, Web Push dociera do urządzenia.", tag: "js-duo-push-test" });
        if (!sent) return json({ error: "Push delivery failed" }, 502, headers);
        record.lastTestAt = Date.now();
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(record), { expirationTtl: 31536000 });
        return json({ ok: true }, 200, headers);
      }
      if (url.pathname === "/schedule-test") {
        if (!admin(request, env)) return json({ error: "Unauthorized" }, 401, headers);
        if (typeof body.endpoint !== "string") return json({ error: "endpoint is required" }, 400, headers);
        const key = await keyFor(body.endpoint);
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!raw) return json({ error: "Subscription not found" }, 404, headers);
        const record = JSON.parse(raw);
        if (!record.subscription || !record.preferences || !record.preferences.enabled) {
          return json({ error: "Subscription is missing or reminders are disabled" }, 409, headers);
        }
        let simulatedAt = new Date();
        if (body.at !== undefined) {
          if (typeof body.at !== "string" || !Number.isFinite(Date.parse(body.at))) {
            return json({ error: "at must be a valid ISO date-time string" }, 400, headers);
          }
          simulatedAt = new Date(body.at);
        }
        const status = dailyScheduleStatus(record, simulatedAt);
        const shouldSend = body.send === true;
        if (shouldSend && !status.eligible) {
          return json({ ok: false, status, sent: false, reason: "Daily reminder is not eligible at the simulated time" }, 200, headers);
        }
        if (!shouldSend) return json({ ok: true, mode: "preview", status, sent: false, stateChanged: false }, 200, headers);
        const sent = await deliver(env, key, record, {
          ...dailyMessage(record),
          tag: "js-duo-daily-reminder-test",
        });
        if (!sent) return json({ ok: false, status, sent: false, stateChanged: false, error: "Push delivery failed" }, 502, headers);
        // Test mode intentionally does not update lastDailyDate or any other subscription state.
        return json({ ok: true, mode: "send", status, sent: true, stateChanged: false }, 200, headers);
      }
      if (url.pathname === "/send-test") {
        if (!admin(request, env)) return json({ error: "Unauthorized" }, 401, headers);
        if (typeof body.endpoint !== "string") return json({ error: "endpoint is required" }, 400, headers);
        const key = await keyFor(body.endpoint);
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!raw) return json({ error: "Subscription not found" }, 404, headers);
        const sent = await deliver(env, key, JSON.parse(raw), {
          title: typeof body.title === "string" ? body.title.slice(0, 100) : "JS Duo — test powiadomień",
          body: typeof body.message === "string" ? body.message.slice(0, 240) : "Web Push działa poprawnie.",
          tag: "js-duo-push-test",
        });
        return sent ? json({ ok: true }, 200, headers) : json({ error: "Push delivery failed" }, 502, headers);
      }
      return json({ error: "Not found" }, 404, headers);
    } catch (error) {
      return json({ error: "Request failed", detail: error instanceof Error ? error.message : "Unknown error" }, 400, headers);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(scheduledRun(env));
  },
};
