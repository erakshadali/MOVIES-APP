const READ_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : '/no-poster.svg'

export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMG_BASE}/${size}${path}` : null

async function tmdbFetch(endpoint, params = {}) {
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

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${READ_TOKEN}`,
      accept: 'application/json',
    },
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid or expired TMDB read access token. Check your .env file.')
    }
    throw new Error(`TMDB request failed (${res.status})`)
  }
  return res.json()
}

export function getGenres() {
  return tmdbFetch('/genre/movie/list').then((data) => data.genres)
}

export function getPopularMovies(page = 1) {
  return tmdbFetch('/movie/popular', { page })
}

export function getTrendingMovies(timeWindow = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`)
}

export function getTopRatedMovies(page = 1) {
  return tmdbFetch('/movie/top_rated', { page })
}

export function getUpcomingMovies(page = 1) {
  return tmdbFetch('/movie/upcoming', { page })
}

export function getNowPlayingMovies(page = 1) {
  return tmdbFetch('/movie/now_playing', { page })
}

export function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', { query, page })
}

export function discoverByGenre(genreId, page = 1) {
  return tmdbFetch('/discover/movie', {
    with_genres: genreId,
    page,
    sort_by: 'popularity.desc',
  })
}

// Pulls details + credits (cast/crew) + videos (trailers) + images (backdrops/posters)
// + similar movies + recommendations + reviews + watch providers, all in ONE request.
export function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response:
      'credits,videos,images,similar,recommendations,reviews,watch/providers,keywords',
    include_image_language: 'en,null',
  })
}

export function youtubeTrailerUrl(videos) {
  if (!videos?.results?.length) return null
  const trailer =
    videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.results.find((v) => v.site === 'YouTube')
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null
}

export const profileUrl = (path, size = 'w185') =>
  path ? `${IMG_BASE}/${size}${path}` : '/no-poster.svg'
