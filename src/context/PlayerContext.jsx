import { createContext, useContext, useState } from 'react'
import PlayerModal from '../components/PlayerModal.jsx'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  // { item, videoKey } — videoKey is set when a specific clip was chosen
  const [playing, setPlaying] = useState(null)

  // play(item)                    -> the title's main trailer, progress is remembered
  // play(item, { videoKey })      -> a specific YouTube clip, progress is not tracked
  function play(item, options = {}) {
    setPlaying({ item, videoKey: options.videoKey || null })
  }

  return (
    <PlayerContext.Provider value={{ play }}>
      {children}
      {playing && (
        <PlayerModal
          movie={playing.item}
          videoKey={playing.videoKey}
          onClose={() => setPlaying(null)}
        />
      )}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
