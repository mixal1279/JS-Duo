# JS Duo Web Push API (Cloudflare Worker)

This worker is the server-side part of real browser Web Push. It stores browser subscription endpoints in Cloudflare KV and sends encrypted notifications through the browser vendor's push service using VAPID. The browser must still opt in and register its service worker.

## Routes

- `GET /health` — health check.
- `GET /vapid-public-key` — returns the public VAPID key.
- `POST /subscribe` — saves a Push API subscription.
- `POST /unsubscribe` — removes a subscription by endpoint.
- `POST /send-test` — sends a test to one stored endpoint; requires `Authorization: Bearer <ADMIN_TOKEN>`.

The admin token is deliberately required for test sending; do not expose it in frontend code. This endpoint is for operator-side verification only. Production event delivery should be called from trusted server-side application logic, never by embedding the admin token in the browser.

## Deploy

1. Create a Cloudflare KV namespace named `JS_DUO_PUSH_SUBSCRIPTIONS`.
2. Replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.toml` with its namespace ID.
3. From this directory run `npm install`.
4. Generate a VAPID key pair with `npx web-push generate-vapid-keys`. Do not commit the private key.
5. Set Worker secrets:
   - `npx wrangler secret put VAPID_PUBLIC_KEY`
   - `npx wrangler secret put VAPID_PRIVATE_KEY`
   - `npx wrangler secret put VAPID_SUBJECT` (a `mailto:` contact)
   - `npx wrangler secret put ADMIN_TOKEN` (a long random secret)
6. Deploy with `npm run deploy`.
7. Set the frontend's `VITE_PUSH_API_URL` to the deployed Worker URL and wire the opt-in flow to fetch `/vapid-public-key`, call `PushManager.subscribe()`, and POST the resulting JSON to `/subscribe`.

## Security and limitations

- Only the GitHub Pages origin configured in `ALLOWED_ORIGIN` is accepted for browser requests. CORS is not authentication; endpoints must still validate input.
- The Worker does not expose a public broadcast endpoint.
- A browser subscription only works for that browser profile/device and must be explicitly approved by the user.
- This Worker stores subscriptions but does not yet schedule JS Duo's daily or inactivity reminders. The app must send a trusted event to a server-side scheduler for those notifications to arrive after the app/browser is closed.
- Keep VAPID private key and admin token only in Worker secrets. Never put them in Vite variables or the Git repository.
