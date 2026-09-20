import { useEffect, useState } from 'react'
import { getGenreMap } from '../api/tmdb.js'

let cached = null

// id -> name lookup for TMDB genres, fetched once and shared.
export function useGenres() {
  const [map, setMap] = useState(cached || {})

  useEffect(() => {
    if (cached) return
    let cancelled = false
    getGenreMap().then((m) => {
      cached = m
      if (!cancelled) setMap(m)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return map
}
