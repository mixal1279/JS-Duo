# JS-Duo online backend (Supabase)

This repository includes a Supabase migration for account profiles, cloud progress, chat messages, friend requests, and duels. The web app currently wires up email/password authentication and progress sync; chat/friend/duel tables are groundwork for the next UI integration step.

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

- The app currently syncs the stats and daily quests snapshots. Review schedules and completed coding projects still use local storage and are not yet synchronized.
- The public leaderboard view exposes only public profile fields and aggregate XP/level/streak. UI integration is a separate step.
- Chat, friend request, and duel tables are created but their existing mock-data UI is not yet connected to them.
- The progress snapshot is client-submitted. RLS prevents users from reading or writing another user's row, but it does not prove that XP was earned legitimately. Server-authoritative lesson grading/reward issuance is required before treating XP, rankings, or duel results as cheat-resistant.