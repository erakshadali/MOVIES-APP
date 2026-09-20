import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import Hero from '../components/Hero.jsx'
import MovieRow from '../components/MovieRow.jsx'
import LazyMovieRow from '../components/LazyMovieRow.jsx'
import MovieCard from '../components/MovieCard.jsx'
import GenreMenu from '../components/GenreMenu.jsx'
import Loader from '../components/Loader.jsx'
import { HeroSkeleton, RowSkeleton } from '../components/Skeleton.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import {
  SORT_OPTIONS,
  discover,
  getGenres,
  getLanguages,
  getMovieList,
  getRegions,
  getTVList,
  getTrending,
  getWatchProviders,
} from '../api/tmdb.js'
import { itemKey, mediaTypeOf } from '../lib/movie.js'
import { defaultRegion } from '../lib/region.js'
import './Home.css'
import './Browse.css'

const RATINGS = [9, 8, 7, 6, 5]
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR + 1 - 1940 }, (_, i) => THIS_YEAR + 1 - i)

// Filters live in the URL, so a filtered view can be reloaded, shared and
// navigated back to.
const FILTER_PARAMS = ['genre', 'year', 'rating', 'lang', 'provider', 'region', 'sort']

function readFilters(params) {
  return {
    genre: params.get('genre') || '',
    year: params.get('year') || '',
    rating: params.get('rating') || '',
    lang: params.get('lang') || '',
    provider: params.get('provider') || '',
    region: params.get('region') || defaultRegion(),
    sort: params.get('sort') || 'popularity',
  }
}

// The genre rows on each page: [row title, TMDB genre id]
const MOVIE_GENRE_ROWS = [
  ['Action', 28],
  ['Comedies', 35],
  ['Thrillers', 53],
  ['Horror', 27],
  ['Sci-Fi', 878],
  ['Romance', 10749],
  ['Family', 10751],
  ['Animation', 16],
  ['Dramas', 18],
  ['Crime', 80],
  ['Documentaries', 99],
]
const TV_GENRE_ROWS = [
  ['Action & Adventure', 10759],
  ['Comedies', 35],
  ['Dramas', 18],
  ['Crime', 80],
  ['Sci-Fi & Fantasy', 10765],
  ['Mystery', 9648],
  ['Animation', 16],
  ['Family', 10751],
  ['Reality', 10764],
  ['Kids', 10762],
  ['Documentaries', 99],
  ['War & Politics', 10768],
]

const results = (request) => request.then((data) => data.results)

function rowsFor(mediaType) {
  const base = mediaType === 'tv' ? '/tv' : '/movies'
  const genreRow = ([title, id]) => ({
    title,
    href: `${base}?genre=${id}`,
    fetcher: () => results(discover(mediaType, { genre: String(id) })),
  })

  if (mediaType === 'tv') {
    return [
      { title: 'Trending This Week', fetcher: () => results(getTrending('tv', 'week')) },
      { title: 'Popular on MovieFlix', fetcher: () => results(getTVList('popular')) },
      { title: 'Top Rated', fetcher: () => results(getTVList('top_rated')) },
      { title: 'Airing Today', fetcher: () => results(getTVList('airing_today')) },
      ...TV_GENRE_ROWS.slice(0, 6).map(genreRow),
      { title: 'On the Air', fetcher: () => results(getTVList('on_the_air')) },
      ...TV_GENRE_ROWS.slice(6).map(genreRow),
    ]
  }
  return [
    { title: 'Trending This Week', fetcher: () => results(getTrending('movie', 'week')) },
    { title: 'Popular on MovieFlix', fetcher: () => results(getMovieList('popular')) },
    { title: 'Top Rated', fetcher: () => results(getMovieList('top_rated')) },
    { title: 'Now Playing in Theatres', fetcher: () => results(getMovieList('now_playing')) },
    ...MOVIE_GENRE_ROWS.slice(0, 6).map(genreRow),
    { title: 'Coming Soon', fetcher: () => results(getMovieList('upcoming')) },
    ...MOVIE_GENRE_ROWS.slice(6).map(genreRow),
  ]
}

// mediaType: 'movie' | 'tv'
export default function Browse({ mediaType }) {
  const [params, setParams] = useSearchParams()
  // only the filter params count: opening a title pop-up (?title=…) must not reload the page
  const filterKey = FILTER_PARAMS.map((name) => params.get(name) || '').join('|')
  const filters = useMemo(() => readFilters(params), [filterKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const [genres, setGenres] = useState([])

  useEffect(() => {
    getGenres(mediaType).then(setGenres).catch(() => {})
  }, [mediaType])

  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    // provider ids are region-specific
    if (name === 'region') next.delete('provider')
    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (params.get('region')) next.set('region', params.get('region'))
    setParams(next)
  }

  // Like Netflix: with nothing chosen you get a banner and rows; picking a genre
  // or a filter switches to a grid of matches.
  const filtered =
    ['genre', 'year', 'rating', 'lang', 'provider'].some((name) => filters[name]) ||
    filters.sort !== 'popularity'

  return filtered ? (
    <BrowseGrid
      mediaType={mediaType}
      genres={genres}
      filters={filters}
      setFilter={setFilter}
      clearFilters={clearFilters}
    />
  ) : (
    <BrowseRows mediaType={mediaType} genres={genres} setFilter={setFilter} />
  )
}

/* ---------- banner + rows (the default view) ---------- */

function BrowseRows({ mediaType, genres, setFilter }) {
  const isTV = mediaType === 'tv'
  const noun = isTV ? 'TV Shows' : 'Movies'
  const { list } = useMyList()
  const [today, setToday] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getTrending(mediaType, 'day')
      .then((data) => !cancelled && setToday(data.results))
      .catch((err) => !cancelled && setError(err.message || 'Could not load titles.'))
    return () => {
      cancelled = true
    }
  }, [mediaType])

  // pick the featured title once per load from today's top five
  const featured = useMemo(() => {
    if (!today) return null
    const candidates = today
      .slice(0, 5)
      .map((item, i) => ({ item, rankLabel: `#${i + 1} in ${noun} Today` }))
      .filter((c) => c.item.backdrop_path)
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
  }, [today, noun])

  const rows = useMemo(() => rowsFor(mediaType), [mediaType])
  const myList = list.filter((item) => mediaTypeOf(item) === mediaType)

  if (error) return <p className="state-message error">{error}</p>

  return (
    <>
      <div className="browse-hero">
        {featured ? <Hero movie={featured.item} rankLabel={featured.rankLabel} /> : <HeroSkeleton />}
        <div className="browse-head">
          <h1 className="browse-title">{noun}</h1>
          <GenreMenu genres={genres} value="" onChange={(id) => setFilter('genre', id)} />
        </div>
      </div>

      <div className="browse-rows">
        {today ? (
          <MovieRow title={`Top 10 ${noun} Today`} movies={today.slice(0, 10)} variant="top10" />
        ) : (
          <RowSkeleton variant="top10" count={7} />
        )}
        <MovieRow title="My List" movies={myList} />
        {rows.map((row) => (
          <LazyMovieRow
            key={row.title}
            title={row.title}
            fetcher={row.fetcher}
            titleHref={row.href}
          />
        ))}
      </div>
    </>
  )
}

/* ---------- grid of matches (after choosing a genre or a filter) ---------- */

function BrowseGrid({ mediaType, genres, filters, setFilter, clearFilters }) {
  const isTV = mediaType === 'tv'
  const noun = isTV ? 'TV Shows' : 'Movies'

  const [languages, setLanguages] = useState([])
  const [regions, setRegions] = useState([])
  const [providers, setProviders] = useState([])
  // the extra filters open by themselves when one of them is already in use
  const [showFilters, setShowFilters] = useState(
    Boolean(filters.year || filters.rating || filters.lang || filters.provider)
  )

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const latestRequest = useRef(0)
  const sentinelRef = useRef(null)

  useEffect(() => {
    getLanguages().then(setLanguages)
    getRegions().then(setRegions)
  }, [])

  useEffect(() => {
    let cancelled = false
    getWatchProviders(mediaType, filters.region).then((list) => {
      if (!cancelled) setProviders(list)
    })
    return () => {
      cancelled = true
    }
  }, [mediaType, filters.region])

  const load = useCallback(
    async (pageToLoad, append) => {
      const requestId = ++latestRequest.current
      setLoading(true)
      setError('')
      try {
        const data = await discover(mediaType, filters, pageToLoad)
        if (requestId !== latestRequest.current) return // a newer filter change superseded this
        setTotalPages(data.total_pages || 1)
        setPage(pageToLoad)
        // TMDB's ranking shifts between pages, so a title can turn up twice: keep the first
        setItems((prev) => {
          const seen = new Set(append ? prev.map(itemKey) : [])
          const fresh = data.results.filter((item) => {
            const key = itemKey(item)
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          return append ? [...prev, ...fresh] : fresh
        })
      } catch (err) {
        if (requestId === latestRequest.current) {
          setError(err.message || 'Something went wrong while fetching titles.')
        }
      } finally {
        if (requestId === latestRequest.current) setLoading(false)
      }
    },
    [mediaType, filters]
  )

  // restart from page 1 whenever any filter changes
  useEffect(() => {
    setItems([])
    load(1, false)
  }, [load])

  // endless scrolling: fetch the next page as the end of the grid comes into view
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || loading || error || page >= totalPages) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) load(page + 1, true)
      },
      { rootMargin: '700px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loading, error, page, totalPages, load, items.length])

  const activeFilterCount = ['year', 'rating', 'lang', 'provider'].filter((n) => filters[n]).length

  return (
    <div className="page browse-page">
      <div className="browse-head browse-head-grid">
        <h1 className="browse-title">{noun}</h1>
        <GenreMenu
          genres={genres}
          value={filters.genre}
          onChange={(id) => setFilter('genre', id)}
        />
        <div className="browse-tools">
          <label className="browse-sort">
            <span>Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value === 'popularity' ? '' : e.target.value)}
              aria-label="Sort by"
            >
              {SORT_OPTIONS[mediaType].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`tool-btn ${showFilters ? 'is-on' : ''}`}
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            aria-controls="browse-filters"
          >
            <SlidersHorizontal size={16} aria-hidden="true" /> Filters
            {activeFilterCount > 0 && <span className="tool-count">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters" id="browse-filters">
          <select
            className={filters.year ? 'active' : ''}
            value={filters.year}
            onChange={(e) => setFilter('year', e.target.value)}
            aria-label={isTV ? 'Filter by first air year' : 'Filter by release year'}
          >
            <option value="">Any year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            className={filters.rating ? 'active' : ''}
            value={filters.rating}
            onChange={(e) => setFilter('rating', e.target.value)}
            aria-label="Minimum rating"
          >
            <option value="">Any rating</option>
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}+ ★
              </option>
            ))}
          </select>

          <select
            className={filters.lang ? 'active' : ''}
            value={filters.lang}
            onChange={(e) => setFilter('lang', e.target.value)}
            aria-label="Original language"
          >
            <option value="">Any language</option>
            {languages.map((lang) => (
              <option key={lang.iso_639_1} value={lang.iso_639_1}>
                {lang.english_name}
              </option>
            ))}
          </select>

          <select
            className={filters.provider ? 'active' : ''}
            value={filters.provider}
            onChange={(e) => setFilter('provider', e.target.value)}
            aria-label="Streaming service"
          >
            <option value="">Any service</option>
            {providers.map((p) => (
              <option key={p.provider_id} value={p.provider_id}>
                {p.provider_name}
              </option>
            ))}
          </select>

          <select
            value={filters.region}
            onChange={(e) => setFilter('region', e.target.value)}
            aria-label="Region for streaming services"
            title="Region used for the streaming-service filter"
          >
            {regions.length === 0 && <option value={filters.region}>{filters.region}</option>}
            {regions.map((r) => (
              <option key={r.iso_3166_1} value={r.iso_3166_1}>
                {r.english_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="browse-crumbs">
        <button className="filter-clear" onClick={clearFilters}>
          ← Back to {noun}
        </button>
      </div>

      {error && <p className="state-message error">{error}</p>}

      {!error && !loading && items.length === 0 && (
        <p className="state-message">No titles match these filters. Try loosening them.</p>
      )}

      <div className="card-grid">
        {items.map((item) => (
          <MovieCard key={itemKey(item)} movie={item} />
        ))}
      </div>

      {loading && <Loader />}
      <div ref={sentinelRef} className="grid-end" aria-hidden="true" />
    </div>
  )
}
