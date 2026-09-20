import { Link } from 'react-router-dom'
import { posterUrl, backdropUrl } from '../api/tmdb.js'
import { itemPath, mediaTypeOf } from '../lib/movie.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useGenres } from '../hooks/useGenres.js'
import './MovieCard.css'

// Works for movies and TV shows.
// variant: 'landscape' (backdrop) | 'poster' | 'top10' (poster with a big rank number)
export default function MovieCard({ movie, variant = 'landscape', rank, progress, onRemove }) {
  const { isInList, toggleList } = useMyList()
  const { play } = usePlayer()
  const genreMap = useGenres()

  const path = itemPath(movie)
  const isTV = mediaTypeOf(movie) === 'tv'
  const inList = isInList(movie)
  const image =
    variant === 'landscape' && movie.backdrop_path
      ? backdropUrl(movie.backdrop_path, 'w500')
      : posterUrl(movie.poster_path)
  const genres = (movie.genre_ids || [])
    .slice(0, 3)
    .map((id) => genreMap[id])
    .filter(Boolean)
  const match = movie.vote_average ? `${Math.round(movie.vote_average * 10)}% Match` : null
  const year = movie.release_date?.slice(0, 4)

  return (
    <article className={`mc mc-${variant}`}>
      {variant === 'top10' && (
        <span className="mc-rank" aria-hidden="true">
          {rank}
        </span>
      )}

      <div className="mc-inner">
        <Link to={path} className="mc-thumb" aria-label={`${movie.title} — details`}>
          <img src={image} alt="" loading="lazy" />
          {isTV && <span className="mc-badge">SERIES</span>}
          <span className="mc-caption">{movie.title}</span>
          {progress > 0 && (
            <span className="mc-progress">
              <span style={{ width: `${Math.min(progress, 100)}%` }} />
            </span>
          )}
        </Link>

        <div className="mc-info">
          <div className="mc-actions">
            <button
              className="mc-btn mc-btn-play"
              onClick={() => play(movie)}
              aria-label={`Play trailer for ${movie.title}`}
            >
              ▶
            </button>
            <button
              className="mc-btn"
              onClick={() => toggleList(movie)}
              aria-label={
                inList ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`
              }
            >
              {inList ? '✓' : '+'}
            </button>
            {onRemove && (
              <button
                className="mc-btn"
                onClick={() => onRemove(movie)}
                aria-label={`Remove ${movie.title} from Continue Watching`}
              >
                ✕
              </button>
            )}
            <Link to={path} className="mc-btn mc-btn-more" aria-label={`More info about ${movie.title}`}>
              ⌄
            </Link>
          </div>
          <h3 className="mc-title">{movie.title}</h3>
          <p className="mc-meta">
            {match && <span className="mc-match">{match}</span>}
            {year && <span>{year}</span>}
            {isTV && <span className="mc-type">Series</span>}
          </p>
          {genres.length > 0 && <p className="mc-genres">{genres.join(' • ')}</p>}
        </div>
      </div>
    </article>
  )
}
