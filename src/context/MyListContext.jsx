import { createContext, useContext, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'
import { sameItem, toSlimItem } from '../lib/movie.js'

const MyListContext = createContext(null)

// Mounted with a key per profile (see ProfileScope), so state never leaks
// between profiles.
export function MyListProvider({ profileId, children }) {
  const storageKey = `mf_list:${profileId}`
  // entries saved before TV support have no media_type; sameItem treats them as movies
  const [list, setList] = useState(() => {
    const stored = readJSON(storageKey, null)
    if (stored) return stored
    // carry over favorites saved by the pre-profiles version of the app
    return profileId === 'default' ? readJSON('movieFavorites', []) : []
  })

  useEffect(() => writeJSON(storageKey, list), [storageKey, list])

  function isInList(item) {
    return list.some((entry) => sameItem(entry, item))
  }

  function toggleList(item) {
    setList((prev) =>
      prev.some((entry) => sameItem(entry, item))
        ? prev.filter((entry) => !sameItem(entry, item))
        : [toSlimItem(item), ...prev]
    )
  }

  return (
    <MyListContext.Provider value={{ list, isInList, toggleList }}>
      {children}
    </MyListContext.Provider>
  )
}

export function useMyList() {
  const ctx = useContext(MyListContext)
  if (!ctx) throw new Error('useMyList must be used inside MyListProvider')
  return ctx
}
