import { getVideos, youtubeTrailerKey } from '../api/tmdb.js'

// A muted, looping, chrome-free YouTube embed for backgrounds and previews.
// loop: repeat the trailer (uses a one-video playlist, which makes YouTube show prev/next buttons)
export function trailerEmbedUrl(key, { loop = true } = {}) {
  return (
    `https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0${loop ? `&loop=1&playlist=${key}` : ''}` +
    '&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&fs=0&enablejsapi=1'
  )
}

// Mute / unmute an embed created with trailerEmbedUrl (needs enablejsapi=1).
export function setYouTubeMuted(iframe, muted) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] }),
    '*'
  )
}

// Autoplaying video is skipped for people who asked for less motion or less data.
export function canAutoplayPreviews() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (navigator.connection?.saveData) return false
  return true
}

const keyCache = new Map() // "movie-550" -> Promise<youtube key | null>

// The trailer's YouTube key for a title, fetched once and remembered.
export function getTrailerKey(type, id) {
  const cacheKey = `${type}-${id}`
  if (!keyCache.has(cacheKey)) {
    keyCache.set(
      cacheKey,
      getVideos(type, id)
        .then(youtubeTrailerKey)
        .catch(() => {
          keyCache.delete(cacheKey)
          return null
        })
    )
  }
  return keyCache.get(cacheKey)
}
