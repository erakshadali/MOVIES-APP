import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyList } from '../context/MyListContext.jsx'
import { itemKey, mediaTypeOf } from '../lib/movie.js'
import MovieCard from '../components/MovieCard.jsx'
import './Home.css'

const FILTERS = [
  ['all', 'All'],
  ['movie', 'Movies'],
  ['tv', 'TV Shows'],
]

export default function MyList() {
  const { list } = useMyList()
  const [filter, setFilter] = useState('all')

  const shown = filter === 'all' ? list : list.filter((item) => mediaTypeOf(item) === filter)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">My List</h1>
        {list.length > 0 && (
          <div className="segmented" role="group" aria-label="Filter My List">
            {FILTERS.map(([value, text]) => (
              <button
                key={value}
                className={`segment ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <p className="state-message">
          Your list is empty. Tap the <strong>+</strong> on any title to save it here.
          <br />
          <Link to="/movies" className="text-link">
            Browse movies
          </Link>
          {' · '}
          <Link to="/tv" className="text-link">
            Browse TV shows
          </Link>
        </p>
      ) : shown.length === 0 ? (
        <p className="state-message">Nothing in this category yet.</p>
      ) : (
        <div className="card-grid">
          {shown.map((item) => (
            <MovieCard key={itemKey(item)} movie={item} />
          ))}
        </div>
      )}
    </div>
  )
}
