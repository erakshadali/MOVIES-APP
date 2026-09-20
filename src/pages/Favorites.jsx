import { useFavorites } from '../context/FavoritesContext.jsx'
import MovieCard from '../components/MovieCard.jsx'
import './Favorites.css'

export default function Favorites() {
  const { favorites } = useFavorites()

  return (
    <div className="container favorites-page">
      <h1 className="marquee-heading">MY WATCHLIST</h1>

      {favorites.length === 0 ? (
        <p className="state-message">
          No favorites yet. Tap the ♡ on any movie to add it here.
        </p>
      ) : (
        <div className="movie-grid">
          {favorites.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}
