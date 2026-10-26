import webpush from "web-push";

interface Env {
  PUSH_SUBSCRIPTIONS: KVNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ADMIN_TOKEN: string;
  ALLOWED_ORIGIN: string;
}

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  return {
    "access-control-allow-origin": origin === env.ALLOWED_ORIGIN ? origin : "null",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function validSubscription(value: unknown): value is PushSubscriptionJSON {
  if (!value || typeof value !== "object") return false;
  const sub = value as Partial<PushSubscriptionJSON>;
  if (typeof sub.endpoint !== "string" || sub.endpoint.length > 4096) return false;
  try {
    const endpoint = new URL(sub.endpoint);
    if (endpoint.protocol !== "https:") return false;
  } catch {
    return false;
  }
  return !!sub.keys &&
    typeof sub.keys.p256dh === "string" &&
    typeof sub.keys.auth === "string" &&
    sub.keys.p256dh.length < 512 &&
    sub.keys.auth.length < 512;
}

async function subscriptionKey(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return "sub:" + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isAdmin(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization") || "";
  return !!env.ADMIN_TOKEN && header === `Bearer ${env.ADMIN_TOKEN}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const origin = request.headers.get("Origin");
    if (origin && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }

    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "js-duo-push-api" }, 200, headers);
      }

      if (request.method === "GET" && url.pathname === "/vapid-public-key") {
        if (!env.VAPID_PUBLIC_KEY) return json({ error: "Push is not configured" }, 503, headers);
        return json({ publicKey: env.VAPID_PUBLIC_KEY }, 200, headers);
      }

      if (request.method === "POST" && url.pathname === "/subscribe") {
        const subscription: unknown = await request.json();
        if (!validSubscription(subscription)) {
          return json({ error: "Invalid Web Push subscription" }, 400, headers);
        }
        const key = await subscriptionKey(subscription.endpoint);
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(subscription), {
          expirationTtl: 60 * 60 * 24 * 365,
        });
        return json({ ok: true }, 201, headers);
      }

      if (request.method === "POST" && url.pathname === "/unsubscribe") {
        const body = await request.json() as { endpoint?: unknown };
        if (typeof body.endpoint !== "string" || body.endpoint.length > 4096) {
          return json({ error: "Invalid endpoint" }, 400, headers);
        }
        await env.PUSH_SUBSCRIPTIONS.delete(await subscriptionKey(body.endpoint));
        return json({ ok: true }, 200, headers);
      }

      if (request.method === "POST" && url.pathname === "/send-test") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401, headers);
        const body = await request.json() as { endpoint?: unknown; title?: unknown; message?: unknown };
        if (typeof body.endpoint !== "string") return json({ error: "endpoint is required" }, 400, headers);
        const key = await subscriptionKey(body.endpoint);
        const stored = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (!stored) return json({ error: "Subscription not found" }, 404, headers);
        if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
          return json({ error: "VAPID is not configured" }, 503, headers);
        }
        webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
        try {
          await webpush.sendNotification(
            JSON.parse(stored) as PushSubscriptionJSON,
            JSON.stringify({
              title: typeof body.title === "string" ? body.title.slice(0, 100) : "JS Duo — test powiadomień",
              body: typeof body.message === "string" ? body.message.slice(0, 240) : "Web Push działa poprawnie.",
              tag: "js-duo-push-test",
              url: env.ALLOWED_ORIGIN + "/JS-Duo/",
            }),
            { TTL: 60, urgency: "normal" },
          );
        } catch (error) {
          const statusCode = typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode: unknown }).statusCode)
            : 0;
          if (statusCode === 404 || statusCode === 410) await env.PUSH_SUBSCRIPTIONS.delete(key);
          return json({ error: "Push delivery failed", statusCode }, 502, headers);
        }
        return json({ ok: true }, 200, headers);
      }

      return json({ error: "Not found" }, 404, headers);
    } catch {
      return json({ error: "Invalid request" }, 400, headers);
    }
  },
};
