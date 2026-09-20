import { useState } from 'react'
import LazyMovieRow from '../components/LazyMovieRow.jsx'
import { getMovieList, getTVList, getTrending } from '../api/tmdb.js'
import './Home.css'

const results = (request) => request.then((data) => data.results)

const WINDOWS = [
  ['day', 'Today'],
  ['week', 'This Week'],
]

export default function NewPopular() {
  const [range, setRange] = useState('week') // trending time window

  const label = range === 'day' ? 'Today' : 'This Week'

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">New &amp; Popular</h1>
        <div className="segmented" role="group" aria-label="Trending time window">
          {WINDOWS.map(([value, text]) => (
            <button
              key={value}
              className={`segment ${range === value ? 'active' : ''}`}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* keyed by window so switching Today / This Week refetches these rows */}
      <LazyMovieRow
        key={`tm-${range}`}
        title={`Trending Movies ${label}`}
        fetcher={() => results(getTrending('movie', range))}
      />
      <LazyMovieRow
        key={`tt-${range}`}
        title={`Trending TV Shows ${label}`}
        fetcher={() => results(getTrending('tv', range))}
      />
      <LazyMovieRow
        key={`tp-${range}`}
        title={`Trending People ${label}`}
        variant="person"
        fetcher={() => results(getTrending('person', range))}
      />
      <LazyMovieRow title="Coming Soon" fetcher={() => results(getMovieList('upcoming'))} />
      <LazyMovieRow title="Now Playing in Theatres" fetcher={() => results(getMovieList('now_playing'))} />
      <LazyMovieRow title="On the Air" fetcher={() => results(getTVList('on_the_air'))} />
      <LazyMovieRow title="Airing Today" fetcher={() => results(getTVList('airing_today'))} />
      <LazyMovieRow title="Popular Movies" fetcher={() => results(getMovieList('popular'))} />
      <LazyMovieRow title="Popular TV Shows" fetcher={() => results(getTVList('popular'))} />
    </div>
  )
}
