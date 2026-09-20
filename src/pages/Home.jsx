import { useEffect, useMemo, useState } from 'react'
import Hero from '../components/Hero.jsx'
import MovieRow from '../components/MovieRow.jsx'
import LazyMovieRow from '../components/LazyMovieRow.jsx'
import Loader from '../components/Loader.jsx'
import { useProgress } from '../context/ProgressContext.jsx'
import { getTrending, getMovieList, getTVList, discover } from '../api/tmdb.js'
import './Home.css'

const results = (request) => request.then((data) => data.results)

// rows below the fold only fetch when they scroll into view
const LAZY_ROWS = [
  { title: 'Trending Movies This Week', fetcher: () => results(getTrending('movie', 'week')) },
  { title: 'Popular TV Shows', fetcher: () => results(getTVList('popular')) },
  { title: 'Now Playing in Theatres', fetcher: () => results(getMovieList('now_playing')) },
  { title: 'Top Rated Movies', fetcher: () => results(getMovieList('top_rated')) },
  { title: 'Top Rated TV Shows', fetcher: () => results(getTVList('top_rated')) },
  { title: 'Airing Today', fetcher: () => results(getTVList('airing_today')) },
  { title: 'Action Movies', fetcher: () => results(discover('movie', { genre: '28' })) },
  { title: 'Action & Adventure Series', fetcher: () => results(discover('tv', { genre: '10759' })) },
  { title: 'Comedies', fetcher: () => results(discover('movie', { genre: '35' })) },
  { title: 'Crime & Mystery Series', fetcher: () => results(discover('tv', { genre: '80|9648' })) },
  { title: 'Sci-Fi & Fantasy Movies', fetcher: () => results(discover('movie', { genre: '878|14' })) },
  { title: 'Sci-Fi & Fantasy Series', fetcher: () => results(discover('tv', { genre: '10765' })) },
  { title: 'Horror Movies', fetcher: () => results(discover('movie', { genre: '27' })) },
  { title: 'Romance', fetcher: () => results(discover('movie', { genre: '10749' })) },
  { title: 'Animation', fetcher: () => results(discover('movie', { genre: '16' })) },
  { title: 'Documentaries', fetcher: () => results(discover('movie', { genre: '99' })) },
  { title: 'Coming Soon', fetcher: () => results(getMovieList('upcoming')) },
]

export default function Home() {
  const [today, setToday] = useState(null) // { movies, shows }
  const [error, setError] = useState('')
  const { continueWatching, progressPercent, removeProgress } = useProgress()

  useEffect(() => {
    let cancelled = false
    Promise.all([getTrending('movie', 'day'), getTrending('tv', 'day')])
      .then(([movies, shows]) => {
        if (!cancelled) setToday({ movies: movies.results, shows: shows.results })
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load titles.'))
    return () => {
      cancelled = true
    }
  }, [])

  // pick the featured title once per load from today's top movies and shows
  const featured = useMemo(() => {
    if (!today) return null
    const candidates = [...today.movies.slice(0, 5), ...today.shows.slice(0, 5)].filter(
      (item) => item.backdrop_path
    )
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
  }, [today])

  if (error) return <p className="state-message error">{error}</p>
  if (!today) return <Loader />

  return (
    <>
      {featured && <Hero movie={featured} />}

      <div className={`home-rows ${featured ? 'overlap' : 'no-hero'}`}>
        <MovieRow
          title="Continue Watching"
          movies={continueWatching.map((entry) => entry.movie)}
          progressFor={progressPercent}
          onRemove={removeProgress}
        />
        <MovieRow title="Top 10 Movies Today" movies={today.movies.slice(0, 10)} variant="top10" />
        <MovieRow title="Top 10 TV Shows Today" movies={today.shows.slice(0, 10)} variant="top10" />
        {LAZY_ROWS.map((row) => (
          <LazyMovieRow key={row.title} title={row.title} fetcher={row.fetcher} />
        ))}
      </div>
    </>
  )
}
