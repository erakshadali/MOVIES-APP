const READ_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : '/no-poster.svg'

export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMG_BASE}/${size}${path}` : null

export const profileUrl = (path, size = 'w185') =>
  path ? `${IMG_BASE}/${size}${path}` : '/no-poster.svg'

export const stillUrl = (path, size = 'w300') => (path ? `${IMG_BASE}/${size}${path}` : null)

export const logoUrl = (path, size = 'w92') => (path ? `${IMG_BASE}/${size}${path}` : null)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const MAX_RETRIES = 2

// TMDB occasionally drops a connection or returns a 5xx; retry those quietly
// so a hiccup doesn't surface as an error in the UI.
async function tmdbFetch(endpoint, params = {}, attempt = 0) {
  if (!READ_TOKEN) {
    throw new Error(
      'Missing TMDB read access token. Copy .env.example to .env and add your token.'
    )
  }
  const url = new URL(`${BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  let res
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${READ_TOKEN}`, accept: 'application/json' },
    })
  } catch {
    if (attempt < MAX_RETRIES) {
      await sleep(400 * (attempt + 1))
      return tmdbFetch(endpoint, params, attempt + 1)
    }
    throw new Error('Could not reach TMDB. Check your internet connection.')
  }

  if (res.status >= 500 && attempt < MAX_RETRIES) {
    await sleep(400 * (attempt + 1))
    return tmdbFetch(endpoint, params, attempt + 1)
  }
  if (!res.ok) {
    const error = new Error(
      res.status === 401
        ? 'Invalid or expired TMDB read access token. Check your .env file.'
        : res.status === 404
          ? 'That page could not be found.'
          : `TMDB request failed (${res.status})`
    )
    error.status = res.status
    throw error
  }
  return res.json()
}

/* ---------- normalising movies, TV shows and people ---------- */

// TMDB names the same things differently for movies and TV (title/name,
// release_date/first_air_date). Everything downstream sees one shape.
export function normalize(item, fallbackType) {
  const type = item.media_type || fallbackType || 'movie'
  if (type === 'person') {
    return {
      id: item.id,
      media_type: 'person',
      name: item.name,
      profile_path: item.profile_path,
      known_for_department: item.known_for_department,
      known_for: (item.known_for || []).map((k) => k.title || k.name).filter(Boolean).slice(0, 3),
    }
  }
  return {
    id: item.id,
    media_type: type,
    title: item.title ?? item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    release_date: item.release_date ?? item.first_air_date,
    genre_ids: item.genre_ids ?? item.genres?.map((g) => g.id) ?? [],
  }
}

export const normalizeList = (list, type) => (list || []).map((item) => normalize(item, type))

async function paged(endpoint, params, type, { people = false } = {}) {
  const data = await tmdbFetch(endpoint, params)
  const keepPeople = people || type === 'person'
  return {
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
    results: normalizeList(data.results, type).filter(
      (item) => keepPeople || item.media_type !== 'person'
    ),
  }
}

/* ---------- lists ---------- */

// type: 'all' | 'movie' | 'tv' | 'person'   window: 'day' | 'week'
export function getTrending(type = 'all', window = 'day', page = 1) {
  return paged(`/trending/${type}/${window}`, { page }, type === 'all' ? undefined : type)
}

// kind: popular | top_rated | upcoming | now_playing
export function getMovieList(kind = 'popular', page = 1) {
  return paged(`/movie/${kind}`, { page }, 'movie')
}

// kind: popular | top_rated | on_the_air | airing_today
export function getTVList(kind = 'popular', page = 1) {
  return paged(`/tv/${kind}`, { page }, 'tv')
}

const SORTS = {
  movie: {
    popularity: 'popularity.desc',
    rating: 'vote_average.desc',
    newest: 'primary_release_date.desc',
    title: 'title.asc',
    revenue: 'revenue.desc',
  },
  tv: {
    popularity: 'popularity.desc',
    rating: 'vote_average.desc',
    newest: 'first_air_date.desc',
    title: 'name.asc',
  },
}

export const SORT_OPTIONS = {
  movie: [
    ['popularity', 'Popularity'],
    ['rating', 'Rating'],
    ['newest', 'Newest'],
    ['revenue', 'Box office'],
    ['title', 'Title (A–Z)'],
  ],
  tv: [
    ['popularity', 'Popularity'],
    ['rating', 'Rating'],
    ['newest', 'Newest'],
    ['title', 'Title (A–Z)'],
  ],
}

// filters: { genre, year, rating, lang, provider, region, sort }
export function discover(type, filters = {}, page = 1) {
  const sort = SORTS[type][filters.sort] ? filters.sort : 'popularity'
  const dateKey = type === 'tv' ? 'first_air_date' : 'primary_release_date'
  const params = {
    page,
    sort_by: SORTS[type][sort],
    with_genres: filters.genre,
    with_original_language: filters.lang,
    'vote_average.gte': filters.rating,
    with_watch_providers: filters.provider,
    watch_region: filters.provider ? filters.region : undefined,
    [type === 'tv' ? 'first_air_date_year' : 'primary_release_year']: filters.year,
  }
  // a 10.0 from a single vote isn't "top rated"
  if (sort === 'rating') params['vote_count.gte'] = 300
  else if (filters.rating) params['vote_count.gte'] = 50
  // "newest" should mean already released, not announced
  if (sort === 'newest') params[`${dateKey}.lte`] = new Date().toISOString().slice(0, 10)
  return paged(`/discover/${type}`, params, type)
}

// kind: 'all' | 'movie' | 'tv' | 'person'
export function search(kind, query, page = 1) {
  const endpoint = kind === 'all' ? 'multi' : kind
  return paged(`/search/${endpoint}`, { query, page }, kind === 'all' ? undefined : kind, {
    people: kind === 'all',
  })
}

/* ---------- genres, languages, providers ---------- */

export function getGenres(type = 'movie') {
  return tmdbFetch(`/genre/${type}/list`).then((data) => data.genres)
}

let genreMapPromise = null

// id -> name across both movie and TV genres, fetched once per page load.
export function getGenreMap() {
  if (!genreMapPromise) {
    genreMapPromise = Promise.all([getGenres('tv'), getGenres('movie')])
      .then(([tv, movie]) =>
        Object.fromEntries([...tv, ...movie].map((genre) => [genre.id, genre.name]))
      )
      .catch(() => {
        genreMapPromise = null
        return {}
      })
  }
  return genreMapPromise
}

let languagesPromise = null

export function getLanguages() {
  if (!languagesPromise) {
    languagesPromise = tmdbFetch('/configuration/languages')
      .then((list) =>
        list
          .filter((l) => l.iso_639_1 !== 'xx' && l.english_name)
          .sort((a, b) => a.english_name.localeCompare(b.english_name))
      )
      .catch(() => {
        languagesPromise = null
        return []
      })
  }
  return languagesPromise
}

let regionsPromise = null

export function getRegions() {
  if (!regionsPromise) {
    regionsPromise = tmdbFetch('/watch/providers/regions')
      .then((data) =>
        data.results.sort((a, b) => a.english_name.localeCompare(b.english_name))
      )
      .catch(() => {
        regionsPromise = null
        return []
      })
  }
  return regionsPromise
}

const providerCache = new Map()

// The most popular streaming services in a region, for the provider filter.
export function getWatchProviders(type, region) {
  const key = `${type}:${region}`
  if (!providerCache.has(key)) {
    providerCache.set(
      key,
      tmdbFetch(`/watch/providers/${type}`, { watch_region: region })
        .then((data) =>
          data.results
            .sort(
              (a, b) =>
                (a.display_priorities?.[region] ?? 999) - (b.display_priorities?.[region] ?? 999)
            )
            .slice(0, 40)
        )
        .catch(() => {
          providerCache.delete(key)
          return []
        })
    )
  }
  return providerCache.get(key)
}

/* ---------- details ---------- */

const MOVIE_APPEND =
  'credits,videos,images,similar,recommendations,reviews,watch/providers,keywords,release_dates,external_ids'
const TV_APPEND =
  'aggregate_credits,credits,videos,images,similar,recommendations,reviews,watch/providers,keywords,content_ratings,external_ids'

// Everything TMDB offers for a title, in ONE request.
export function getDetails(type, id) {
  return tmdbFetch(`/${type}/${id}`, {
    append_to_response: type === 'tv' ? TV_APPEND : MOVIE_APPEND,
    include_image_language: 'en,null',
  }).then((data) => ({
    ...data,
    media_type: type,
    title: data.title ?? data.name,
    release_date: data.release_date ?? data.first_air_date,
    similar: { ...data.similar, results: normalizeList(data.similar?.results, type) },
    recommendations: {
      ...data.recommendations,
      results: normalizeList(data.recommendations?.results, type),
    },
  }))
}

export function getSeason(tvId, seasonNumber) {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`)
}

export function getCollection(id) {
  return tmdbFetch(`/collection/${id}`).then((data) => ({
    ...data,
    parts: normalizeList(data.parts, 'movie').sort((a, b) =>
      (a.release_date || '9999').localeCompare(b.release_date || '9999')
    ),
  }))
}

export function getPerson(id) {
  return tmdbFetch(`/person/${id}`, {
    append_to_response: 'combined_credits,images,external_ids',
  })
}

export function getVideos(type, id) {
  return tmdbFetch(`/${type}/${id}/videos`)
}

/* ---------- small helpers over TMDB payloads ---------- */

const VIDEO_ORDER = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes', 'Bloopers']

// YouTube videos only, best kinds first (official trailers, then teasers, clips…).
export function youtubeVideos(videos) {
  const rank = (video) => {
    const index = VIDEO_ORDER.indexOf(video.type)
    return index === -1 ? VIDEO_ORDER.length : index
  }
  return (videos?.results || [])
    .filter((v) => v.site === 'YouTube')
    .sort((a, b) => rank(a) - rank(b) || Number(b.official) - Number(a.official))
}

export function youtubeTrailerKey(videos) {
  const list = youtubeVideos(videos)
  return (list.find((v) => v.type === 'Trailer') || list[0])?.key || null
}

// Age rating for a movie, preferring the viewer's region and falling back to US.
export function movieCertification(details, region = 'US') {
  const countries = details.release_dates?.results || []
  const entry =
    countries.find((c) => c.iso_3166_1 === region && c.release_dates.some((r) => r.certification)) ||
    countries.find((c) => c.iso_3166_1 === 'US')
  return entry?.release_dates.map((r) => r.certification).find(Boolean) || ''
}

export function tvCertification(details, region = 'US') {
  const countries = details.content_ratings?.results || []
  const entry =
    countries.find((c) => c.iso_3166_1 === region && c.rating) ||
    countries.find((c) => c.iso_3166_1 === 'US')
  return entry?.rating || ''
}
