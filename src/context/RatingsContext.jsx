import { createContext, useContext, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'
import { itemKey, toSlimItem } from '../lib/movie.js'

const RatingsContext = createContext(null)

// Thumbs up / thumbs down / love, per profile. These drive "Because you liked…"
// and "Top Picks for you" on the home page.
export function RatingsProvider({ profileId, children }) {
  const storageKey = `mf_ratings:${profileId}`
  // { ["movie-550"]: { rating: 'up' | 'down' | 'love', item, at } }
  const [ratings, setRatings] = useState(() => readJSON(storageKey, {}))

  useEffect(() => writeJSON(storageKey, ratings), [storageKey, ratings])

  const ratingOf = (item) => ratings[itemKey(item)]?.rating || null

  // choosing the rating you already gave removes it
  function rate(item, rating) {
    setRatings((prev) => {
      const key = itemKey(item)
      const next = { ...prev }
      if (prev[key]?.rating === rating) delete next[key]
      else next[key] = { rating, item: toSlimItem(item), at: Date.now() }
      return next
    })
  }

  const entries = Object.values(ratings).sort((a, b) => b.at - a.at)
  const liked = entries.filter((e) => e.rating === 'up' || e.rating === 'love').map((e) => e.item)
  const isDisliked = (item) => ratings[itemKey(item)]?.rating === 'down'

  return (
    <RatingsContext.Provider value={{ ratingOf, rate, liked, isDisliked }}>
      {children}
    </RatingsContext.Provider>
  )
}

export function useRatings() {
  const ctx = useContext(RatingsContext)
  if (!ctx) throw new Error('useRatings must be used inside RatingsProvider')
  return ctx
}
