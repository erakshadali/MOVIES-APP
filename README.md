# MovieFlix — a Netflix-style movie & TV browser

A Netflix-inspired React + Vite app powered by live data from the TMDB API.
It plays **trailers** (from YouTube); for full titles, "Watch now" opens the
official streaming service. Built with React 18, React Router, Context API,
lucide-react icons and plain CSS.

## Features

**The Netflix experience**
- **Landing page** (`/welcome`) — poster wall, feature bands and an FAQ, shown
  once to first-time visitors.
- **Profiles** — "Who's watching?" picker (up to 5). Each profile has its own My
  List, Continue Watching and ratings.
- **Hero banner** — a featured title with a muted autoplaying trailer, a
  "Top 10" badge ("#2 in Movies Today"), Play / More Info / My List.
- **Title pop-up** — click any card and a pop-up opens over the page with an
  autoplaying trailer, thumbs up / down / love, cast, episodes, "More Like This"
  and "About". The title is in the URL (`?title=movie-550`), so Back closes it,
  refresh keeps it, and links can be shared.
- **Hover previews** — hover a card for a moment and its trailer plays inside it.
- **Personalised rows** — "Top Picks for <you>" and "Because you liked …", built
  from your My List and thumbs-ups.
- **Rows** — scroll arrows, expanding cards, Top 10 numbered posters, Continue
  Watching (the trailer player remembers where you stopped).
- **Skeleton loaders**, fade-in images and page transitions.

**Browse & discover**
- **Movies** and **TV Shows** pages laid out like Netflix: a trailer banner with a
  **Genres** menu, then rows (Top 10, Trending, Popular, and one row per genre with
  an "Explore All" link). Choosing a genre or a filter opens a grid with endless
  scrolling. A **Filters** button adds year, minimum rating, language, streaming
  service + region and sorting; all of it lives in the URL.
- **New & Popular** with a Today / This Week toggle, incl. trending people.
- **Search** across movies, TV shows and people.
- **Details pages** — cast, episodes with a season picker, videos, photos,
  reviews, companies, franchise collection, age rating, budget / box office.
- **Actor & crew pages** — biography, "Known for", filterable filmography.
- **Where to watch** — streaming services by country with a "Watch now" button
  that opens the official service.

**Made for every screen**
- Phones get a **bottom tab bar** and a bottom-sheet pop-up; tablets and desktops
  get the full top bar. Tested from 320 px phones to 2560 px ultrawide screens
  and phones in landscape, with no sideways scrolling.
- Installable: has a web app manifest and icons ("Add to Home Screen").
- Pages and the pop-up are code-split and downloaded only when needed.
- Respects reduced-motion and data-saver settings (no autoplay video then).

> MovieFlix plays trailers only. It does not stream full films, and it is not
> affiliated with Netflix.

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
`VITE_` variables are baked into the built site, so the token is visible to
anyone who inspects it; it is read-only and can be regenerated on TMDB.

**Never commit `.env` to a public repo** — it is already in `.gitignore`.

## Project structure

```
src/
  api/tmdb.js               — every TMDB call; normalises movie/TV/person shapes
  lib/                      — storage, item helpers, region helpers, trailer
                              helpers, watch-provider links, welcome flag
  hooks/                    — useInView (lazy rows), useGenres
  context/
    ProfileContext / ProfileScope — profiles; per-profile state remounts on switch
    MyListContext, ProgressContext, RatingsContext — per-profile data
    PlayerContext           — trailer player
    TitleModalContext       — opens/closes the title pop-up via the URL
  components/
    Navbar (+ phone tab bar), Hero, MovieRow, LazyMovieRow, MovieCard (hover
    preview), TitleModal, ModalHost, PlayerModal, WhereToWatch, VideosSection,
    SeasonsSection, PersonCard, Skeleton, FadeImg, Footer, ErrorBoundary
  pages/
    Home, Browse, Search, NewPopular, MyList, TitleDetails, Person, Profiles,
    Landing, NotFound
  App.jsx                   — lazy-loaded routes, layout, error boundary
```

Routes: `/welcome`, `/profiles`, `/`, `/movies`, `/tv`, `/search?q=`, `/new`,
`/my-list`, `/movie/:id`, `/tv/:id`, `/person/:id`.

## Notes
- Data is stored in the browser's `localStorage`, per profile (`mf_list:<id>`,
  `mf_progress:<id>`, `mf_ratings:<id>`). Movies and TV shows can share numeric
  ids, so entries are keyed by media type + id.
- Region for age ratings and streaming availability is guessed from your browser
  language (falls back to US) and can be changed on the page.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
  Streaming availability data is from JustWatch.
