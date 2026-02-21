# Movie Night Picker — Progress Notes

## Status: Implementation Complete — Awaiting External Setup

The full app is scaffolded and ready to run. Two external services need to be configured before first launch.

---

## Setup Checklist

### 1. Node.js
- Install Node.js (v20+ recommended): https://nodejs.org
- Then run: `npm install`

### 2. TMDB API Key
- [ ] Create account: https://www.themoviedb.org/signup
- [ ] Go to Settings → API → Request API key (free)
- [ ] Add to `.env.local`: `PUBLIC_TMDB_API_KEY=<your_key>`

### 3. Supabase Project
- [ ] Create account: https://supabase.com
- [ ] Create new project (free tier is fine)
- [ ] Open SQL Editor and run the contents of `supabase/schema.sql`
- [ ] Verify realtime is enabled: Database → Replication → confirm `rooms`, `room_members`, `votes`, `matches` are in the `supabase_realtime` publication
- [ ] Add to `.env.local`:
  ```
  PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```

---

## Completed Phases

### Phase 1 — Scaffold & Config ✅
- `package.json` with SvelteKit 2 + Svelte 5 + Tailwind CSS v4 + Supabase JS
- `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no postcss.config needed)
- `.env.local` with placeholder keys

### Phase 2 — Core Libraries ✅
- `src/lib/types.ts` — TypeScript interfaces for all DB tables
- `src/lib/supabase.ts` — Supabase client singleton
- `src/lib/tmdb.ts` — `fetchMoviePool(count)` helper (pulls popular movies, maps to DB shape)
- `src/routes/+layout.svelte` — global CSS import

### Phase 3 — TMDB Integration ✅
- Implemented in `src/lib/tmdb.ts`
- On room creation (home page): fetches 25 popular movies and inserts into `room_movies`

### Phase 4 — Home Page ✅
- Create room: generates 4-char code, inserts room + members + movies, stores session, redirects to lobby
- Join room: validates code + status, inserts member, redirects to lobby
- `sessionStorage` used for `member_id`, `room_id`, `is_host`

### Phase 5 — Room Lobby ✅
- Realtime subscription to `room_members` (shows new joiners live)
- Realtime subscription to `rooms` (redirects when status → active)
- Host sees "Start Voting" button; non-hosts see waiting indicator
- `majority_threshold` computed from final member count at start time

### Phase 6 — Swipe Voting UI ✅
- `SwipeStack.svelte`: pointer events for drag, threshold-based commit, snap-back animation
- `MovieCard.svelte`: poster + gradient overlay + title/genre/rating/overview
- Tap buttons (👎/👍) as accessible alternative to swipe
- Vote progress indicator below stack

### Phase 7 — Consensus Detection ✅
- After each vote: checks `liked_count >= majority_threshold`
- Uses `maybeSingle()` guard to prevent duplicate match rows
- Updates `room.status = 'finished'` and inserts into `matches`
- All clients subscribe to `matches` → redirect to result screen

### Phase 8 — Result Screen ✅
- Fetches matched movie from `matches` + `room_movies`
- Shows `MatchResult.svelte` celebration screen
- Handles no-match case (all movies exhausted)
- "Play Again" clears session and returns to home

---

## Known Limitations / Future Improvements
- TMDB API key is exposed client-side — move to a SvelteKit server route (`+server.ts`) for production
- No room code collision handling (very unlikely with 32^4 = ~1M combinations)
- No room cleanup / TTL (old rooms accumulate in DB — add a cron job or pg_cron)
- "Play Again" creates a brand new room rather than recycling the existing one
- No loading skeleton / image lazy-loading on cards
- Not tested on Safari iOS yet (pointer events should work, but worth verifying)
