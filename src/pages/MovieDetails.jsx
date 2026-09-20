import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getMovieDetails,
  posterUrl,
  backdropUrl,
  profileUrl,
  youtubeTrailerUrl,
} from '../api/tmdb.js'
import { useFavorites } from '../context/FavoritesContext.jsx'
import Loader from '../components/Loader.jsx'
import MovieRow from '../components/MovieRow.jsx'
import TrailerModal from '../components/TrailerModal.jsx'
import './MovieDetails.css'

export default function MovieDetails() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTrailer, setShowTrailer] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    setLoading(true)
    setError('')
    setMovie(null)
    window.scrollTo(0, 0)
    getMovieDetails(id)
      .then(setMovie)
      .catch((err) => setError(err.message || 'Could not load this movie.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader />
  if (error) return <p className="state-message error">{error}</p>
  if (!movie) return null

  const favorite = isFavorite(movie.id)
  const backdrop = backdropUrl(movie.backdrop_path)
  const director = movie.credits?.crew?.find((c) => c.job === 'Director')
  const writers = movie.credits?.crew?.filter((c) => c.department === 'Writing').slice(0, 3) || []
  const cast = movie.credits?.cast?.slice(0, 10) || []
  const trailerUrl = youtubeTrailerUrl(movie.videos)
  const backdropImages = movie.images?.backdrops?.slice(0, 8) || []
  const similar = movie.similar?.results?.slice(0, 12) || []
  const recommendations = movie.recommendations?.results?.slice(0, 12) || []
  const reviews = movie.reviews?.results?.slice(0, 4) || []
  const providers = movie['watch/providers']?.results?.IN || movie['watch/providers']?.results?.US
  const keywords = movie.keywords?.keywords?.slice(0, 8) || []

  return (
    <div className="details-page">
      {backdrop && (
        <div className="details-backdrop" style={{ backgroundImage: `url(${backdrop})` }} />
      )}

      <div className="container details-content">
        <Link to="/" className="back-link">
          ← Back
        </Link>

        <div className="details-grid">
          <img
            className="details-poster"
            src={posterUrl(movie.poster_path)}
            alt={`${movie.title} poster`}
          />

          <div className="details-info">
            <h1 className="marquee-heading">{movie.title}</h1>
            {movie.tagline && <p className="tagline">{movie.tagline}</p>}

            <div className="details-meta">
              <span>★ {movie.vote_average?.toFixed(1)} ({movie.vote_count} votes)</span>
              <span>{movie.release_date?.slice(0, 4)}</span>
              <span>{movie.runtime ? `${movie.runtime} min` : ''}</span>
              {movie.status && <span>{movie.status}</span>}
            </div>

            <div className="genre-tags">
              {movie.genres?.map((g) => (
                <span key={g.id} className="genre-tag">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="overview">{movie.overview}</p>

            {director && (
              <p className="crew-line">
                <strong>Director:</strong> {director.name}
              </p>
            )}
            {writers.length > 0 && (
              <p className="crew-line">
                <strong>Writers:</strong> {writers.map((w) => w.name).join(', ')}
              </p>
            )}

            {keywords.length > 0 && (
              <div className="keyword-tags">
                {keywords.map((k) => (
                  <span key={k.id} className="keyword-tag">
                    {k.name}
                  </span>
                ))}
              </div>
            )}

            <div className="action-row">
              {trailerUrl && (
                <button className="btn btn-primary" onClick={() => setShowTrailer(true)}>
                  ▶ Watch trailer
                </button>
              )}
              <button
                className={`btn ${favorite ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => toggleFavorite(movie)}
              >
                {favorite ? '♥ Remove from favorites' : '♡ Add to favorites'}
              </button>
            </div>

            {providers?.flatrate?.length > 0 && (
              <div className="providers">
                <span className="providers-label">Stream on:</span>
                {providers.flatrate.map((p) => (
                  <img
                    key={p.provider_id}
                    src={posterUrl(p.logo_path, 'w92')}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="provider-logo"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <section className="cast-section">
            <h2 className="marquee-heading section-title">Cast</h2>
            <div className="cast-scroll">
              {cast.map((actor) => (
                <div className="cast-card" key={actor.id}>
                  <img src={profileUrl(actor.profile_path)} alt={actor.name} loading="lazy" />
                  <p className="cast-name">{actor.name}</p>
                  <p className="cast-character">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {backdropImages.length > 0 && (
          <section className="gallery-section">
            <h2 className="marquee-heading section-title">Photos</h2>
            <div className="gallery-scroll">
              {backdropImages.map((img, i) => (
                <img
                  key={i}
                  src={backdropUrl(img.file_path, 'w780')}
                  alt={`${movie.title} still ${i + 1}`}
                  loading="lazy"
                  className="gallery-img"
                />
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="reviews-section">
            <h2 className="marquee-heading section-title">Reviews</h2>
            <div className="reviews-list">
              {reviews.map((r) => (
                <div className="review-card" key={r.id}>
                  <div className="review-header">
                    <strong>{r.author}</strong>
                    {r.author_details?.rating && (
                      <span className="review-rating">★ {r.author_details.rating}</span>
                    )}
                  </div>
                  <p className="review-content">
                    {r.content.length > 400 ? `${r.content.slice(0, 400)}…` : r.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="container">
        <MovieRow title="Similar Movies" movies={similar} />
        <MovieRow title="You Might Also Like" movies={recommendations} />
      </div>

      {showTrailer && <TrailerModal url={trailerUrl} onClose={() => setShowTrailer(false)} />}
    </div>
  )
}
