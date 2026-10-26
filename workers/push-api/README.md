# JS Duo Web Push API (Cloudflare Worker)

Live endpoint: https://js-duo-push-api.michalkowalczyk489.workers.dev

This Worker implements browser Web Push using the Web Crypto API and Cloudflare KV. It stores each browser subscription and preferences, sends encrypted Web Push messages with VAPID, and runs daily/inactivity reminders on a 15-minute Cron Trigger.

## Routes

- `GET /health` — health check.
- `GET /vapid-public-key` — public VAPID key for browser subscription.
- `POST /subscribe` — saves a Push API subscription and reminder preferences.
- `POST /preferences` — updates reminder settings for a registered subscription.
- `POST /activity` — updates the last activity timestamp, resetting the inactivity timer.
- `POST /unsubscribe` — removes a subscription.
- `POST /test` — sends one test notification to a registered endpoint; rate limited to one per minute.
- `POST /send-test` — administrative test route requiring `Authorization: Bearer <ADMIN_TOKEN>`.

## Cloudflare configuration

- KV binding: `PUSH_SUBSCRIPTIONS`
- Secrets: `VAPID_PRIVATE_JWK`, `ADMIN_TOKEN`
- Non-secret bindings: `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `ALLOWED_ORIGIN`
- Cron: `*/15 * * * *`

Never put the VAPID private key or admin token in frontend code, Vite variables, or Git. A browser must explicitly grant notification permission before the app can create a subscription. The current client syncs preferences when saved and syncs activity when recorded.

## Notes

- The app origin is restricted to `https://mixal1279.github.io`; the app is served under `/JS-Duo/`.
- KV currently stores subscription data for up to one year.
- Scheduled reminders are sent only for subscriptions with reminders enabled. Inactivity alerts fire once after 24 hours without activity and reset when the app syncs new activity.
- To remove a browser subscription, use the app's future unsubscribe control or call `POST /unsubscribe` with its endpoint.
