import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import PersonCard from '../components/PersonCard.jsx'
import Loader from '../components/Loader.jsx'
import { search } from '../api/tmdb.js'
import { itemKey } from '../lib/movie.js'
import './Home.css'

const TABS = [
  ['all', 'All'],
  ['movie', 'Movies'],
  ['tv', 'TV Shows'],
  ['person', 'People'],
]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q')?.trim() || ''
  const tab = TABS.some(([value]) => value === params.get('tab')) ? params.get('tab') : 'all'

  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const latestRequest = useRef(0)

  const load = useCallback(
    async (pageToLoad, append) => {
      const requestId = ++latestRequest.current
      if (!query) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const data = await search(tab, query, pageToLoad)
        if (requestId !== latestRequest.current) return // a newer search superseded this one
        setTotalPages(data.total_pages || 1)
        setPage(pageToLoad)
        setResults((prev) => (append ? [...prev, ...data.results] : data.results))
      } catch (err) {
        if (requestId === latestRequest.current) setError(err.message || 'Search failed.')
      } finally {
        if (requestId === latestRequest.current) setLoading(false)
      }
    },
    [query, tab]
  )

  useEffect(() => {
    setResults([])
    load(1, false)
  }, [load])

  function selectTab(value) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete('tab')
    else next.set('tab', value)
    setParams(next, { replace: true })
  }

  const people = results.filter((r) => r.media_type === 'person')
  const titles = results.filter((r) => r.media_type !== 'person')
  const empty = query && !loading && !error && results.length === 0

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">{query ? `Results for “${query}”` : 'Search'}</h1>
        <div className="segmented" role="group" aria-label="Result type">
          {TABS.map(([value, text]) => (
            <button
              key={value}
              className={`segment ${tab === value ? 'active' : ''}`}
              onClick={() => selectTab(value)}
              aria-pressed={tab === value}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {!query && (
        <p className="state-message">Search for movies, TV shows, actors and directors.</p>
      )}
      {error && <p className="state-message error">{error}</p>}
      {empty && <p className="state-message">Nothing found for “{query}”. Try a different search.</p>}

      {/* On "All", people sit in a strip above the titles */}
      {tab === 'all' && people.length > 0 && (
        <>
          <h2 className="section-heading">People</h2>
          <div className="person-strip">
            {people.slice(0, 8).map((person) => (
              <div className="person-strip-item" key={person.id}>
                <PersonCard person={person} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'person' ? (
        <div className="person-grid">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        titles.length > 0 && (
          <>
            {tab === 'all' && people.length > 0 && <h2 className="section-heading">Movies &amp; TV</h2>}
            <div className="card-grid">
              {titles.map((item) => (
                <MovieCard key={itemKey(item)} movie={item} />
              ))}
            </div>
          </>
        )
      )}

      {loading && <Loader />}

      {!loading && !error && page < totalPages && results.length > 0 && (
        <div className="load-more-wrap">
          <button className="btn btn-secondary" onClick={() => load(page + 1, true)}>
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
