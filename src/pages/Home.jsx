import { useEffect, useMemo, useState } from 'react'
import Hero from '../components/Hero.jsx'
import MovieRow from '../components/MovieRow.jsx'
import LazyMovieRow from '../components/LazyMovieRow.jsx'
import { HeroSkeleton, RowSkeleton } from '../components/Skeleton.jsx'
import { useProgress } from '../context/ProgressContext.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import { useRatings } from '../context/RatingsContext.jsx'
import { useProfile } from '../context/ProfileContext.jsx'
import { itemKey, mediaTypeOf } from '../lib/movie.js'
import {
  getTrending,
  getMovieList,
  getTVList,
  getRecommendations,
  discover,
} from '../api/tmdb.js'
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

// TV shows use a different set of genre ids than movies; this maps the closest ones.
const MOVIE_TO_TV_GENRE = { 28: 10759, 12: 10759, 878: 10765, 14: 10765, 27: 9648, 53: 80, 10749: 18, 10752: 10768 }

// alternate movies and shows so neither type crowds the other out
function interleave(a, b) {
  const out = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i])
    if (b[i]) out.push(b[i])
  }
  return out
}

export default function Home() {
  const [today, setToday] = useState(null) // { movies, shows }
  const [error, setError] = useState('')
  const { continueWatching, progressPercent, removeProgress } = useProgress()
  const { list, isInList } = useMyList()
  const { liked, isDisliked } = useRatings()
  const { current } = useProfile()

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

  // pick the featured title once per load from today's top movies and shows,
  // remembering where it ranks so the hero can say "#2 in Movies Today"
  const featured = useMemo(() => {
    if (!today) return null
    const candidates = [
      ...today.movies.slice(0, 5).map((item, i) => ({ item, rankLabel: `#${i + 1} in Movies Today` })),
      ...today.shows.slice(0, 5).map((item, i) => ({ item, rankLabel: `#${i + 1} in TV Shows Today` })),
    ].filter((c) => c.item.backdrop_path)
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
  }, [today])

  // what this profile has shown it likes: the genres of everything liked or in My List
  const topGenres = useMemo(() => {
    const counts = new Map()
    ;[...liked, ...list].forEach((item) =>
      (item.genre_ids || []).forEach((g) => counts.set(g, (counts.get(g) || 0) + 1))
    )
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([genre]) => genre)
  }, [liked, list])

  const anchor = liked[0] // most recently liked title

  if (error) return <p className="state-message error">{error}</p>
  if (!today) {
    return (
      <>
        <HeroSkeleton />
        <div className="home-rows overlap">
          <RowSkeleton variant="top10" count={7} />
          <RowSkeleton count={7} />
        </div>
      </>
    )
  }

  const fresh = (items) => items.filter((m) => !isInList(m) && !isDisliked(m))

  async function topPicks() {
    const movieGenres = topGenres.join('|')
    const tvGenres = [...new Set(topGenres.map((g) => MOVIE_TO_TV_GENRE[g] || g))].join('|')
    const [movies, shows] = await Promise.all([
      results(discover('movie', { genre: movieGenres })),
      results(discover('tv', { genre: tvGenres })),
    ])
    return fresh(interleave(movies, shows)).slice(0, 20)
  }

  const becauseYouLiked = () =>
    results(getRecommendations(mediaTypeOf(anchor), anchor.id)).then((items) =>
      fresh(items).filter((m) => itemKey(m) !== itemKey(anchor))
    )

  return (
    <>
      {featured && <Hero movie={featured.item} rankLabel={featured.rankLabel} />}

      <div className={`home-rows ${featured ? 'overlap' : 'no-hero'}`}>
        <MovieRow
          title="Continue Watching"
          movies={continueWatching.map((entry) => entry.movie)}
          progressFor={progressPercent}
          onRemove={removeProgress}
        />
        {topGenres.length > 0 && (
          <LazyMovieRow
            key={`picks-${topGenres.join('-')}`}
            title={`Top Picks for ${current?.name || 'You'}`}
            fetcher={topPicks}
          />
        )}
        <MovieRow title="My List" movies={list} />
        {anchor && (
          <LazyMovieRow
            key={`because-${itemKey(anchor)}`}
            title={`Because you liked ${anchor.title}`}
            fetcher={becauseYouLiked}
          />
        )}
        <MovieRow title="Top 10 Movies Today" movies={today.movies.slice(0, 10)} variant="top10" />
        <MovieRow title="Top 10 TV Shows Today" movies={today.shows.slice(0, 10)} variant="top10" />
        {LAZY_ROWS.map((row) => (
          <LazyMovieRow key={row.title} title={row.title} fetcher={row.fetcher} />
        ))}
      </div>
    </>
  )
}
