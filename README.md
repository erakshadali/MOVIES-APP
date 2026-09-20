# MovieFlix — a Netflix-style movie & TV browser

A Netflix-inspired React app powered by live data from the TMDB API. Built with
React Router, Context API, and plain CSS.

## Features

**Browsing**
- **Movies and TV shows** everywhere — cards, rows, search, My List, details.
- **Hero banner** with a muted autoplaying trailer (skipped on phones and with
  reduced-motion), Play / More Info / My List buttons, mute toggle.
- **Netflix-style rows** — scroll arrows, cards that expand on hover with
  play / add / details buttons, match %, year, genres. Rows fetch lazily as you
  scroll.
- **Top 10** rows for movies and for TV shows (numbered posters).
- **Movies** and **TV Shows** pages with filters: genre, year, minimum rating,
  original language, **streaming service + region**, and sort (popularity,
  rating, newest, title, box office). Filters live in the URL, so a filtered view
  can be reloaded or shared.
- **New & Popular** — coming soon, in theatres, on the air, airing today, and
  trending movies / shows / **people** with a Today / This Week toggle.
- **Search** across movies, TV shows and people, with All / Movies / TV Shows /
  People tabs.

**Details pages**
- **Movies:** age rating, budget & box office, production companies, franchise
  **collection** ("Part of the … Collection"), IMDb / website links.
- **TV shows:** created by, network, status, next episode, and a **season picker
  with the full episode list** (stills, air dates, ratings, summaries).
- **Both:** all **videos** (trailers, teasers, clips, featurettes, behind the
  scenes) that play in-app, cast (each links to their page), photos, reviews,
  keywords, streaming availability (stream / rent / buy, data from JustWatch),
  similar and recommended titles.

**Actor & crew pages** — photo, biography, born / died / age, birthplace,
IMDb / Instagram / X links, "Known for", a filterable **filmography** by
department (Acting, Directing, Writing, …), and photos.

**Profiles & personalisation**
- "Who's watching?" picker: add, rename, delete (up to 5). Each profile has its
  own **My List** and **Continue Watching**.
- **Continue Watching** — the trailer player remembers where you stopped and
  resumes from there; a red progress bar shows on the card.

> Titles play their **YouTube trailers and clips** — TMDB provides metadata, not
> the films themselves. "Continue Watching" therefore tracks trailer progress.

## Setup

```bash
npm install
npm run dev
```

The app reads a TMDB **Read Access Token** from `.env`:

```
VITE_TMDB_READ_TOKEN=your_token_here
```

Get one at TMDB → Settings → API → "API Read Access Token". See `.env.example`.

**Never commit `.env` to a public repo** — it's already in `.gitignore`.

## Project structure

```
src/
  api/tmdb.js               — every TMDB call; normalises movie/TV/person shapes;
                              retries dropped connections
  lib/                      — storage, item helpers (movie+tv keys), region/format
                              helpers, YouTube API loader
  hooks/                    — useInView (lazy rows), useGenres (id -> name)
  context/
    ProfileContext.jsx      — profiles + current profile
    ProfileScope.jsx        — remounts per-profile state when you switch profiles
    MyListContext.jsx       — per-profile My List
    ProgressContext.jsx     — per-profile watch progress
    PlayerContext.jsx       — play(item, { videoKey }) from anywhere
  components/
    Navbar, Hero, MovieRow, LazyMovieRow, MovieCard, PersonCard,
    PlayerModal, VideosSection, SeasonsSection, Loader
  pages/
    Home, Browse (movies + TV, filters), Search, NewPopular, MyList,
    TitleDetails (movies + TV), Person, Profiles
  App.jsx                   — routes; everything but /profiles needs a profile
```

Routes: `/`, `/movies`, `/tv`, `/search?q=`, `/new`, `/my-list`, `/movie/:id`,
`/tv/:id`, `/person/:id`, `/profiles`.

## Notes
- Data is stored in the browser's `localStorage`, keyed per profile
  (`mf_list:<id>`, `mf_progress:<id>`). Movies and TV shows can share numeric
  ids, so entries are keyed by media type + id. Data saved by earlier versions
  of the app (movie-only entries, old favorites) is migrated automatically.
- The region for age ratings and streaming availability is guessed from your
  browser language (falls back to US); the Movies / TV pages have a region
  picker for the streaming-service filter.
- Without a valid API key the app shows a clear error instead of breaking.
- The app is dark-only, matching the Netflix look.
