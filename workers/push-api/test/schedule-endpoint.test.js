import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../src/index.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ORIGIN = "https://mixal1279.github.io";
const ADMIN_TOKEN = "test-admin-token";
const toBase64Url = (bytes) => Buffer.from(bytes).toString("base64url");

async function fixture({ atTime = "18:00", lastDailyDate = "" } = {}) {
  const subscriptionKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const p256dh = toBase64Url(await crypto.subtle.exportKey("raw", subscriptionKeys.publicKey));
  const auth = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const endpoint = "https://push.example.test/send/" + crypto.randomUUID();
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  const kvKey = "sub:" + Array.from(new Uint8Array(keyBytes), b => b.toString(16).padStart(2, "0")).join("");

  const vapidKeys = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const vapidJwk = await crypto.subtle.exportKey("jwk", vapidKeys.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", vapidKeys.publicKey);
  const publicKey = toBase64Url(Buffer.concat([
    Buffer.from([4]),
    Buffer.from(publicJwk.x, "base64url"),
    Buffer.from(publicJwk.y, "base64url"),
  ]));

  const record = {
    subscription: { endpoint, keys: { p256dh, auth } },
    preferences: { enabled: true, time: atTime, timezone: "Europe/Warsaw", tone: "friendly", streak: 3 },
    lastDailyDate,
    lastActivityAt: Date.now(),
    createdAt: Date.now(),
    lastInactivityAt: 0,
  };
  const store = new Map([[kvKey, JSON.stringify(record)]]);
  const env = {
    ALLOWED_ORIGIN: ORIGIN,
    ADMIN_TOKEN,
    VAPID_PUBLIC_KEY: publicKey,
    VAPID_PRIVATE_JWK: JSON.stringify(vapidJwk),
    VAPID_SUBJECT: "https://github.com/mixal1279/JS-Duo",
    PUSH_SUBSCRIPTIONS: {
      async get(key) { return store.get(key) ?? null; },
      async put(key, value) { store.set(key, value); },
      async delete(key) { store.delete(key); },
    },
  };
  return { endpoint, kvKey, record, store, env };
}

async function requestSchedule(f, body, token = ADMIN_TOKEN) {
  const headers = { Origin: ORIGIN, "Content-Type": "application/json" };
  if (token !== null) headers.Authorization = "Bearer " + token;
  return worker.fetch(new Request("https://worker.example.test/schedule-test", {
    method: "POST",
    headers,
    body: JSON.stringify({ endpoint: f.endpoint, ...body }),
  }), f.env);
}

test("schedule-test rejects requests without valid admin authorization", async () => {
  const f = await fixture();
  const before = f.store.get(f.kvKey);
  const response = await requestSchedule(f, {}, null);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
  assert.equal(f.store.get(f.kvKey), before);
});

test("preview mode does not send a push or mutate subscription state", async (t) => {
  const f = await fixture();
  const before = f.store.get(f.kvKey);
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async (...args) => { fetchCalls++; return originalFetch(...args); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await requestSchedule(f, {
    at: "2026-10-26T17:05:00.000Z",
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.mode, "preview");
  assert.equal(result.sent, false);
  assert.equal(result.stateChanged, false);
  assert.equal(result.status.eligible, true);
  assert.equal(fetchCalls, 0);
  assert.equal(f.store.get(f.kvKey), before);
});

test("send mode refuses an ineligible time without attempting delivery", async (t) => {
  const f = await fixture({ lastDailyDate: "2026-10-26" });
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async (...args) => { fetchCalls++; return originalFetch(...args); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const before = f.store.get(f.kvKey);
  const response = await requestSchedule(f, {
    at: "2026-10-26T17:05:00.000Z",
    send: true,
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.ok, false);
  assert.equal(result.sent, false);
  assert.equal(result.status.eligible, false);
  assert.equal(fetchCalls, 0);
  assert.equal(f.store.get(f.kvKey), before);
});

test("eligible send mode delivers a push but leaves lastDailyDate and KV state unchanged", async (t) => {
  const f = await fixture();
  const before = f.store.get(f.kvKey);
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status: 201 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await requestSchedule(f, {
    at: "2026-10-26T17:05:00.000Z",
    send: true,
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.mode, "send");
  assert.equal(result.sent, true);
  assert.equal(result.stateChanged, false);
  assert.equal(result.status.eligible, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, f.endpoint);
  assert.equal(f.store.get(f.kvKey), before);
  assert.equal(JSON.parse(f.store.get(f.kvKey)).lastDailyDate, "");
});
