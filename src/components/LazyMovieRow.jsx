import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import MovieRow from './MovieRow.jsx'
import { RowSkeleton } from './Skeleton.jsx'

// A row that only fetches its movies once it scrolls near the viewport,
// showing a shimmering placeholder in the meantime.
export default function LazyMovieRow({ title, fetcher, variant, titleHref }) {
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
    <div ref={ref}>
      {movies ? (
        <MovieRow title={title} movies={movies} variant={variant} titleHref={titleHref} />
      ) : (
        <RowSkeleton count={7} variant={variant === 'person' ? 'poster' : variant} />
      )}
    </div>
  )
}
