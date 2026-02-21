# Movie Night Picker — AI Context

## Project Overview
Mobile-first "swipe to pick a movie" web app. 2–5 players join a shared room, swipe right/left on movie cards, and when a **majority** likes the same movie, all players see a match screen in real time.

## Tech Stack
- **Frontend**: SvelteKit 2 + Svelte 5 (runes) + TypeScript
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no postcss.config needed)
- **Backend/DB**: Supabase (Postgres + Realtime subscriptions)
- **Movie data**: TMDB API (popular movies endpoint)

## Environment Variables
All in `.env.local` (gitignored):
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_TMDB_API_KEY=
```
All are `PUBLIC_` so they're accessible client-side. The Supabase anon key is safe to expose. For production, move TMDB key to a server route.

## Project Structure
```
src/
├── lib/
│   ├── supabase.ts       # Supabase client singleton
│   ├── tmdb.ts           # TMDB API: fetchMoviePool(count)
│   └── types.ts          # Room, RoomMember, RoomMovie, Vote, Match
└── routes/
    ├── +layout.svelte    # Imports app.css globally
    ├── +page.svelte      # Home: create or join room
    ├── components/
    │   ├── MovieCard.svelte    # Poster + genre + overview card
    │   ├── SwipeStack.svelte   # Gesture handler, dispatches onvote
    │   ├── RoomLobby.svelte    # Member list + start button
    │   └── MatchResult.svelte  # Celebration screen
    └── room/[code]/
        ├── +page.svelte        # Lobby (waiting room)
        ├── vote/+page.svelte   # Swipe voting interface
        └── result/+page.svelte # Matched movie result
```

## Key Patterns

### Session Storage
Member identity is persisted across page navigations via `sessionStorage`:
- `member_id` — UUID of the current player's room_members row
- `room_id` — UUID of the current room
- `is_host` — "true" if this player created the room

### Realtime Subscriptions
Use Supabase channels with `postgres_changes` listener. Always unsubscribe `onDestroy`.
```ts
const channel = supabase.channel('name')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, handler)
  .subscribe();
// cleanup
onDestroy(() => channel.unsubscribe());
```

### Consensus Logic
```
majority_threshold = floor(member_count / 2) + 1
Set when host clicks "Start Voting" (stored in rooms.majority_threshold)
After each liked vote: if liked_count >= majority_threshold → insert match + set room.status = 'finished'
```

### Svelte 5 Runes
Use `$state`, `$derived`, `$effect` throughout. Component props via `let { prop } = $props()`. Callback props instead of event dispatchers (`onvote`, `onstart`, `onplayagain`).

### Route Params
Use `import { page } from '$app/state'` (SvelteKit 2.12+): `page.params.code`

## Database Schema
See `supabase/schema.sql` for full schema + RLS policies.

Tables: `rooms`, `room_members`, `room_movies`, `votes`, `matches`

Realtime enabled on: `rooms`, `room_members`, `votes`, `matches`

## Supabase Setup Steps
1. Create project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Confirm realtime is enabled in Database → Replication → supabase_realtime publication
4. Copy URL and anon key into `.env.local`

## TMDB Setup Steps
1. Create account at https://www.themoviedb.org/signup
2. Settings → API → Request API key (free tier)
3. Copy key into `.env.local`

## Running Locally
```bash
npm install
npm run dev
```
Open on two tabs or two devices on the same LAN to test real-time sync.
