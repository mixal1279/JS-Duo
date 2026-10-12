# JS-Duo online backend (Supabase)

This repository includes a Supabase migration for account profiles, cloud progress, chat messages, friend requests, and duels. The web app wires up email/password authentication, cloud progress sync (stats, quests, review schedule, completed coding projects), and the online leaderboard. Chat/friend/duel tables are groundwork for the next UI integration step.

## 1. Create a Supabase project

1. Create a project at https://supabase.com.
2. Open Project Settings → API (or Data API depending on dashboard version).
3. Copy the project URL and the public anon/publishable key.
4. Add these environment variables to the local .env file and to the deployment environment:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Only the public anon/publishable key belongs in the frontend. Never use the service_role key in a VITE_* variable or commit real credentials.

## 2. Create the schema

Run supabase/migrations/202610120001_online_foundation.sql in the Supabase SQL Editor, or apply it with the Supabase CLI. The migration enables Row Level Security and policies for profiles, private progress, chat, friend requests, and duels.

## 3. Configure authentication

In Authentication → URL Configuration, set the production Site URL and add the local development URL (for example http://localhost:3000) to the allowed redirect URLs. Configure email confirmation according to the desired account flow. When email confirmation is enabled, signup may ask the user to verify their email before signing in.

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
- The progress snapshot is client-submitted. RLS prevents users from reading or writing another user's private row, but it does not prove that XP was earned legitimately. Server-authoritative lesson grading/reward issuance is required before treating XP, rankings, or duel results as cheat-resistant.