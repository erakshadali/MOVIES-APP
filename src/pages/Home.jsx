import { useEffect, useState, useCallback } from 'react'
import MovieCard from '../components/MovieCard.jsx'
import MovieRow from '../components/MovieRow.jsx'
import Loader from '../components/Loader.jsx'
import {
  getGenres,
  searchMovies,
  discoverByGenre,
  getTrendingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
} from '../api/tmdb.js'
import './Home.css'

export default function Home() {
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // extra curated rows shown only on the default (no search / no genre) view
  const [rows, setRows] = useState({ trending: [], topRated: [], upcoming: [], nowPlaying: [] })
  const [rowsLoading, setRowsLoading] = useState(true)

  const browsing = Boolean(query.trim() || selectedGenre)

  useEffect(() => {
    getGenres().then(setGenres).catch(() => {})
  }, [])

  useEffect(() => {
    setRowsLoading(true)
    Promise.all([
      getTrendingMovies('week'),
      getTopRatedMovies(),
      getUpcomingMovies(),
      getNowPlayingMovies(),
    ])
      .then(([trending, topRated, upcoming, nowPlaying]) => {
        setRows({
          trending: trending.results,
          topRated: topRated.results,
          upcoming: upcoming.results,
          nowPlaying: nowPlaying.results,
        })
      })
      .catch(() => {})
      .finally(() => setRowsLoading(false))
  }, [])

  const fetchMovies = useCallback(
    async (pageToLoad, append) => {
      if (!browsing) return
      setLoading(true)
      setError('')
      try {
        let data
        if (query.trim()) {
          data = await searchMovies(query.trim(), pageToLoad)
        } else {
          data = await discoverByGenre(selectedGenre, pageToLoad)
        }
        setTotalPages(data.total_pages || 1)
        setMovies((prev) => (append ? [...prev, ...data.results] : data.results))
      } catch (err) {
        setError(err.message || 'Something went wrong while fetching movies.')
      } finally {
        setLoading(false)
      }
    },
    [query, selectedGenre, browsing]
  )

  // refetch from page 1 whenever search / genre changes
  useEffect(() => {
    setPage(1)
    if (browsing) fetchMovies(1, false)
    else setMovies([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedGenre])

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchMovies(nextPage, true)
  }

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'rating') return b.vote_average - a.vote_average
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'newest') return (b.release_date || '').localeCompare(a.release_date || '')
    return 0
  })

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1 className="marquee-heading hero-title">
            FIND YOUR NEXT<br />FAVORITE FILM
          </h1>
          <p className="hero-sub">
            Search thousands of movies, filter by genre, and build your own watchlist.
          </p>
          <input
            className="search-input"
            type="search"
            placeholder="Search for a movie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search movies"
          />
        </div>
      </section>

      <section className="container filters-bar">
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort movies"
        >
          <option value="default">Sort: Popularity</option>
          <option value="rating">Sort: Rating (high to low)</option>
          <option value="newest">Sort: Newest</option>
          <option value="title">Sort: Title (A–Z)</option>
        </select>
      </section>

      <section className="container">
        {browsing ? (
          <>
            {error && <p className="state-message error">{error}</p>}

            {!error && sortedMovies.length === 0 && !loading && (
              <p className="state-message">No movies found. Try a different search.</p>
            )}

            <div className="movie-grid">
              {sortedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {loading && <Loader />}

            {!loading && !error && page < totalPages && sortedMovies.length > 0 && (
              <div className="load-more-wrap">
                <button className="btn btn-outline" onClick={handleLoadMore}>
                  Load more
                </button>
              </div>
            )}
          </>
        ) : rowsLoading ? (
          <Loader />
        ) : (
          <>
            <MovieRow title="Trending This Week" movies={rows.trending} />
            <MovieRow title="Now Playing" movies={rows.nowPlaying} />
            <MovieRow title="Top Rated" movies={rows.topRated} />
            <MovieRow title="Upcoming" movies={rows.upcoming} />
          </>
        )}
      </section>
    </>
  )
}
