# Movie Night Picker

A mobile-first "swipe to pick a movie" app for groups of 2–5 people. Join a shared room, swipe right to like or left to pass on movie cards, and when a majority agrees on the same film — everyone sees the match in real time.

## Live App

**https://movienight.lemadchef.com**

## How It Works

1. One person creates a room and shares the 4-letter code
2. Everyone joins using that code
3. The host starts voting once everyone is in
4. Swipe right to like, left to pass
5. When a majority likes the same movie, everyone sees the match

## Tech Stack

- **Frontend**: SvelteKit 2 + Svelte 5 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Realtime**: Supabase
- **Movie Data**: TMDB API
- **Hosting**: Vercel

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the schema from `supabase/schema.sql`
- A [TMDB](https://www.themoviedb.org/settings/api) API key

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   ```

3. Run the Supabase schema in your project's SQL editor:
   ```
   supabase/schema.sql
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173) in two browser tabs to test multiplayer locally.
