import { useEffect, useRef, useState } from 'react'
import { X } from "lucide-react"
import { getVideos, youtubeTrailerKey } from '../api/tmdb.js'
import { loadYouTubeApi } from '../lib/youtube.js'
import { mediaTypeOf } from '../lib/movie.js'
import { useProgress } from '../context/ProgressContext.jsx'
import './PlayerModal.css'

// videoKey: play this exact YouTube clip (progress isn't remembered for clips);
// without it, the title's main trailer plays and progress is saved/resumed.
export default function PlayerModal({ movie, videoKey, onClose }) {
  const { getProgress, saveProgress } = useProgress()
  const hostRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | none | error

  // the effect below must not restart when saveProgress gets a new identity
  const saveRef = useRef(saveProgress)
  saveRef.current = saveProgress
  const resumeAt = useRef(videoKey ? 0 : (getProgress(movie)?.time ?? 0))

  useEffect(() => {
    let cancelled = false
    let player = null
    let timer = null

    function persist() {
      if (videoKey) return
      try {
        const duration = player?.getDuration?.()
        const time = player?.getCurrentTime?.()
        if (duration > 0) saveRef.current(movie, time, duration)
      } catch {
        // player not ready yet
      }
    }

    async function init() {
      try {
        const key =
          videoKey || youtubeTrailerKey(await getVideos(mediaTypeOf(movie), movie.id))
        if (cancelled) return
        if (!key) {
          setStatus('none')
          return
        }
        const YT = await loadYouTubeApi()
        if (cancelled) return

        // YouTube replaces the node it is given, so hand it one React doesn't own
        const mount = document.createElement('div')
        hostRef.current.appendChild(mount)
        player = new YT.Player(mount, {
          videoId: key,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            start: Math.floor(resumeAt.current),
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => setStatus('ready'),
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) persist()
            },
          },
        })
        timer = setInterval(persist, 3000)
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    init()
    return () => {
      cancelled = true
      clearInterval(timer)
      persist()
      try {
        player?.destroy()
      } catch {
        // already gone
      }
    }
  }, [movie.id, movie.media_type, videoKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="player-overlay"
      onClick={onClose}
      role="dialog"
      aria-label={`Playing ${movie.title}`}
    >
      <div className="player-box" onClick={(e) => e.stopPropagation()}>
        <div className="player-bar">
          <span className="player-title">{movie.title}</span>
          <button className="player-close" onClick={onClose} aria-label="Close player">
            <X size={24} />
          </button>
        </div>
        <div className="player-stage">
          <div ref={hostRef} className="player-host" />
          {status === 'loading' && <div className="player-msg">Loading…</div>}
          {status === 'none' && (
            <div className="player-msg">No trailer is available for this title.</div>
          )}
          {status === 'error' && (
            <div className="player-msg">
              Couldn’t load the player. Check your connection and try again.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
