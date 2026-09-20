import { Link } from 'react-router-dom'
import { posterUrl } from '../api/tmdb.js'
import { useFavorites } from '../context/FavoritesContext.jsx'
import './MovieCard.css'

export default function MovieCard({ movie }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(movie.id)

  function handleFavoriteClick(e) {
    e.preventDefault()
    toggleFavorite(movie)
  }

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card">
      <div className="poster-wrap">
        <img
          src={posterUrl(movie.poster_path)}
          alt={`${movie.title} poster`}
          loading="lazy"
        />
        <button
          className={`fav-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorite ? '♥' : '♡'}
        </button>
        <span className="rating-badge">★ {movie.vote_average?.toFixed(1) ?? '—'}</span>
      </div>
      <div className="movie-card-info">
        <h3>{movie.title}</h3>
        <p>{movie.release_date?.slice(0, 4) || 'TBA'}</p>
      </div>
    </Link>
  )
}
