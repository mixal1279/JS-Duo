# JS-Duo online backend (Supabase)

This repository includes a Supabase migration for account profiles, cloud progress, chat messages, friend requests, and duels. The web app wires up email/password authentication, cloud progress sync (stats, quests, review schedule, completed coding projects), and the online leaderboard. Chat/friend/duel tables are groundwork for the next UI integration step.

## 1. Create a Supabase project

1. Create a project at https://supabase.com.
2. Open Project Settings → API (or Data API depending on dashboard version).
3. Copy the project URL and the public anon/publishable key.
4. Add these environment variables to the local `.env` file and to the deployment environment. For GitHub Actions, configure repository Actions secrets named `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_APP_URL` (defaults to `https://mixal1279.github.io/JS-Duo/`):

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
VITE_APP_URL=https://mixal1279.github.io/JS-Duo/
```

Only the public anon/publishable key belongs in the frontend. Never use the service_role key in a VITE_* variable or commit real credentials.

## 2. Create the schema

Apply the migrations in filename order (first `202610120001_online_foundation.sql`, then `202610270001_security_hardening.sql`) in the Supabase SQL Editor, or apply them with the Supabase CLI. They enable Row Level Security for profiles, private progress, chat, friend requests, and duels, and restrict client-side updates to social data. If you already applied the first migration, apply the security-hardening migration as well.

## 3. Configure authentication

In Authentication → URL Configuration, set the production Site URL to `https://mixal1279.github.io/JS-Duo/` and add that URL plus the local development URL (for example `http://localhost:3000`) to the allowed redirect URLs. The password-reset email returns to the hosted web app; on Android, finish the reset in that browser page, then reopen the app and sign in with the new password. Configure email confirmation according to the desired account flow. When email confirmation is enabled, signup may ask the user to verify their email before signing in.

## 4. Run and verify

```bash
npm ci
npm run lint
npm run build
npm run dev
```

Open the Konto tab to register or sign in. The first successful sign-in creates a cloud snapshot from the local progress if no snapshot exists. Existing cloud progress is loaded into the app, and subsequent changes are saved after a short debounce. Local progress remains available without a network connection.

## Current limitations

- Review schedules and completed project IDs are included in the cloud snapshot; active editor text and review-session UI state remain local.
- The leaderboard is loaded from the public view when a user signs in; league grouping still uses the app's existing client-side presentation.
- Community chat messages are stored online for authenticated users. Reactions are currently client-side only and are not synchronized between devices. Friend requests and duels are not yet connected to the database.
- The progress snapshot is client-submitted. RLS prevents users from reading or writing another user's private row, but it does not prove that XP was earned legitimately. Server-authoritative lesson grading/reward issuance is required before treating XP or rankings as cheat-resistant.
- Client accounts cannot directly update duel records or scores. Add a trusted server-side function before connecting duel gameplay to the database.