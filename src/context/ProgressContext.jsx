import { createContext, useContext, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'
import { itemKey, toSlimItem } from '../lib/movie.js'

const ProgressContext = createContext(null)

const MIN_SECONDS = 5 // ignore accidental opens
const FINISHED_RATIO = 0.95 // past this, the title counts as watched

// Entries saved before TV support were keyed by bare movie id ("550");
// they are now "movie-550".
function migrate(entries) {
  return Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => [
      key.includes('-') ? key : `movie-${key}`,
      entry,
    ])
  )
}

export function ProgressProvider({ profileId, children }) {
  const storageKey = `mf_progress:${profileId}`
  // { ["movie-550"]: { movie, time, duration, updatedAt } }
  const [entries, setEntries] = useState(() => migrate(readJSON(storageKey, {})))

  useEffect(() => writeJSON(storageKey, entries), [storageKey, entries])

  function saveProgress(item, time, duration) {
    if (!(duration > 0) || time < MIN_SECONDS) return
    setEntries((prev) => {
      const next = { ...prev }
      if (time / duration >= FINISHED_RATIO) {
        delete next[itemKey(item)]
      } else {
        next[itemKey(item)] = {
          movie: toSlimItem(item),
          time,
          duration,
          updatedAt: Date.now(),
        }
      }
      return next
    })
  }

  function removeProgress(item) {
    setEntries((prev) => {
      const next = { ...prev }
      delete next[itemKey(item)]
      return next
    })
  }

  function getProgress(item) {
    return entries[itemKey(item)] || null
  }

  // 0–100, for the red bar on a card
  function progressPercent(item) {
    const entry = entries[itemKey(item)]
    return entry ? (entry.time / entry.duration) * 100 : 0
  }

  const continueWatching = Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <ProgressContext.Provider
      value={{ continueWatching, getProgress, progressPercent, saveProgress, removeProgress }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
