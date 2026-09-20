import { createContext, useContext, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'

const ProfileContext = createContext(null)

export const PROFILE_COLORS = ['#e50914', '#0071eb', '#f5a623', '#46d369', '#b04bf0', '#00b8d4']
export const MAX_PROFILES = 5

const DEFAULT_PROFILES = [{ id: 'default', name: 'You', color: PROFILE_COLORS[0] }]

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(() => {
    const stored = readJSON('mf_profiles', null)
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_PROFILES
  })
  const [currentId, setCurrentId] = useState(() => readJSON('mf_current_profile', null))

  useEffect(() => writeJSON('mf_profiles', profiles), [profiles])
  useEffect(() => writeJSON('mf_current_profile', currentId), [currentId])

  // a stored current id can point at a profile that no longer exists
  const current = profiles.find((p) => p.id === currentId) || null

  function selectProfile(id) {
    setCurrentId(id)
  }

  function leaveProfile() {
    setCurrentId(null)
  }

  function addProfile(name) {
    const profile = {
      id: Date.now().toString(36),
      name: name.trim() || 'Profile',
      color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
    }
    setProfiles((prev) => [...prev, profile])
    return profile
  }

  function renameProfile(id, name) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
    )
  }

  function removeProfile(id) {
    if (profiles.length <= 1) return
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    if (currentId === id) setCurrentId(null)
    localStorage.removeItem(`mf_list:${id}`)
    localStorage.removeItem(`mf_progress:${id}`)
    localStorage.removeItem(`mf_ratings:${id}`)
  }

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        current,
        selectProfile,
        leaveProfile,
        addProfile,
        renameProfile,
        removeProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
