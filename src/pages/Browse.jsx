import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import Loader from '../components/Loader.jsx'
import {
  SORT_OPTIONS,
  discover,
  getGenres,
  getLanguages,
  getRegions,
  getWatchProviders,
} from '../api/tmdb.js'
import { itemKey } from '../lib/movie.js'
import { defaultRegion } from '../lib/region.js'
import './Home.css'

const RATINGS = [9, 8, 7, 6, 5]
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR + 1 - 1940 }, (_, i) => THIS_YEAR + 1 - i)

const FILTER_PARAMS = ["genre", "year", "rating", "lang", "provider", "region", "sort"]

// Filters live in the URL, so a filtered view can be reloaded, shared and
// navigated back to.
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

// mediaType: 'movie' | 'tv'
export default function Browse({ mediaType }) {
  const [params, setParams] = useSearchParams()
  // only the filter params count: opening a title pop-up (?title=…) must not reload the list
  const filterKey = FILTER_PARAMS.map((name) => params.get(name) || "").join("|")
  const filters = useMemo(() => readFilters(params), [filterKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const isTV = mediaType === 'tv'

  const [genres, setGenres] = useState([])
  const [languages, setLanguages] = useState([])
  const [regions, setRegions] = useState([])
  const [providers, setProviders] = useState([])

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const latestRequest = useRef(0)

  useEffect(() => {
    getGenres(mediaType).then(setGenres).catch(() => {})
    getLanguages().then(setLanguages)
    getRegions().then(setRegions)
  }, [mediaType])

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
        setItems((prev) => (append ? [...prev, ...data.results] : data.results))
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

  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    // provider ids are region-specific
    if (name === 'region') next.delete('provider')
    setParams(next)
  }

  const activeCount = ['genre', 'year', 'rating', 'lang', 'provider'].filter(
    (name) => filters[name]
  ).length + (filters.sort !== 'popularity' ? 1 : 0)

  const genreName = genres.find((g) => String(g.id) === filters.genre)?.name
  const noun = isTV ? 'TV Shows' : 'Movies'
  const heading = genreName ? `${genreName} ${noun}` : noun

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">{heading}</h1>
      </div>

      <div className="filters">
        <select
          className={filters.genre ? 'active' : ''}
          value={filters.genre}
          onChange={(e) => setFilter('genre', e.target.value)}
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

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

        <select
          className={filters.sort !== 'popularity' ? 'active' : ''}
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value === 'popularity' ? '' : e.target.value)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS[mediaType].map(([value, label]) => (
            <option key={value} value={value}>
              Sort: {label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            className="filter-clear"
            onClick={() => {
              const next = new URLSearchParams()
              if (params.get('region')) next.set('region', params.get('region'))
              setParams(next)
            }}
          >
            Clear filters
          </button>
        )}
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

      {!loading && !error && page < totalPages && items.length > 0 && (
        <div className="load-more-wrap">
          <button className="btn btn-secondary" onClick={() => load(page + 1, true)}>
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
