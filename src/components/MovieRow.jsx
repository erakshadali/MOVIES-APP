import MovieCard from './MovieCard.jsx'
import './MovieRow.css'

export default function MovieRow({ title, movies }) {
  if (!movies || movies.length === 0) return null

  return (
    <section className="movie-row">
      <div className="container">
        <h2 className="movie-row-title marquee-heading">{title}</h2>
      </div>
      <div className="movie-row-scroll container">
        {movies.map((movie) => (
          <div className="movie-row-item" key={movie.id}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  )
}
