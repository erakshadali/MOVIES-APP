import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import MovieRow from './MovieRow.jsx'

// A row that only fetches its movies once it scrolls near the viewport.
export default function LazyMovieRow({ title, fetcher, variant }) {
  const [ref, inView] = useInView('400px')
  const [movies, setMovies] = useState(null)

  useEffect(() => {
    if (!inView) return
    let cancelled = false
    fetcher()
      .then((results) => !cancelled && setMovies(results))
      .catch(() => !cancelled && setMovies([]))
    return () => {
      cancelled = true
    }
    // fetcher is an inline function in the caller; inView is the only real trigger
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} style={movies ? undefined : { minHeight: 200 }}>
      {movies && <MovieRow title={title} movies={movies} variant={variant} />}
    </div>
  )
}
