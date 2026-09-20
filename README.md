# MovieHouse — Movies Selector App (v2, fully dynamic)

A multi-page React app for browsing, searching, and favoriting movies, powered by
live data from the TMDB API. Built with React Router, Context API, and plain CSS.

## What's new in this version
- Real, live movie data from TMDB (search, popular, genre filter) instead of a
  hardcoded list
- Home page now shows curated rows — Trending This Week, Now Playing, Top
  Rated, Upcoming — each horizontally scrollable
- Movie details page pulls everything TMDB offers for a title in one request:
  cast (with photos), YouTube trailer (modal player), backdrop photo gallery,
  similar movies, recommended movies, user reviews, streaming/watch
  providers, and keywords
- Fully responsive layout — mobile, tablet, and desktop, with a collapsing
  hamburger nav on small screens
- Loading and error states on every data fetch
- "Load more" pagination on search/genre results
- Dark / light mode toggle (persisted)
- Favorites persisted in localStorage (only the fields needed for the card —
  not the full bloated details object)
- Distinct "cinema marquee" visual identity (Bebas Neue + Inter, gold/indigo palette)

## Setup

The `.env` file already has your TMDB Read Access Token filled in, so you can
just install and run:

```bash
npm install
npm run dev
```

If the token ever expires or you regenerate it (TMDB account → Settings →
API → "API Read Access Token"), update it in `.env`:
```
VITE_TMDB_READ_TOKEN=your_new_token_here
```

**Never commit `.env` to a public GitHub repo** — it's already listed in
`.gitignore`. If you push this project to GitHub for your portfolio, double
check `.env` isn't included in the commit.

## Project structure

```
src/
  api/tmdb.js               — all TMDB API calls in one place
  context/FavoritesContext.jsx
  context/ThemeContext.jsx
  components/Navbar.jsx
  components/MovieCard.jsx
  components/MovieRow.jsx   — horizontal scrollable row (trending/top rated/etc.)
  components/TrailerModal.jsx
  components/Loader.jsx
  pages/Home.jsx             — hero, search, genre filter, sort, curated rows / grid
  pages/MovieDetails.jsx     — trailer, cast, gallery, similar, reviews, providers
  pages/Favorites.jsx        — saved watchlist
  App.jsx                    — routes
  main.jsx                   — providers + router setup
  index.css                  — design tokens, global + responsive base styles
```

## Notes
- Without a valid API key, the app will show a clear error message instead of
  breaking — it never fails silently.
- Sorting (rating / newest / title) happens client-side on whatever page of
  results is currently loaded, matching how the original app's sort-by-rating
  worked.
