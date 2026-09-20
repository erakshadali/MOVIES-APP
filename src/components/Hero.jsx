import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Info, Plus, Check, Volume2, VolumeX } from 'lucide-react'
import { backdropUrl } from '../api/tmdb.js'
import { itemPath, mediaTypeOf } from '../lib/movie.js'
import {
  canAutoplayPreviews,
  getTrailerKey,
  setYouTubeMuted,
  trailerEmbedUrl,
} from '../lib/trailer.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTitleModal } from '../context/TitleModalContext.jsx'
import './Hero.css'

// A full-screen background trailer is heavy on phones, so they get the still
// backdrop only (as do people who asked for less motion or less data).
const allowVideo =
  typeof window !== 'undefined' &&
  canAutoplayPreviews() &&
  !window.matchMedia('(max-width: 720px)').matches

// rankLabel: e.g. "#2 in Movies Today", shown as a Top 10 badge
export default function Hero({ movie, rankLabel }) {
  const { play } = usePlayer()
  const { isInList, toggleList } = useMyList()
  const modal = useTitleModal()
  const heroRef = useRef(null)
  const frameRef = useRef(null)

  const [trailerKey, setTrailerKey] = useState(null)
  const [onScreen, setOnScreen] = useState(true)
  const [videoShown, setVideoShown] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    setTrailerKey(null)
    setVideoShown(false)
    setMuted(true)
    if (!allowVideo) return
    let cancelled = false
    getTrailerKey(mediaTypeOf(movie), movie.id).then((key) => !cancelled && setTrailerKey(key))
    return () => {
      cancelled = true
    }
  }, [movie.id, movie.media_type]) // eslint-disable-line react-hooks/exhaustive-deps

  // unmount the video once the hero scrolls away so it stops playing and buffering
  useEffect(() => {
    const el = heroRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.2,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!onScreen) setVideoShown(false)
  }, [onScreen])

  function handleFrameLoad() {
    // give the video a moment to start so YouTube's loading UI never shows
    setTimeout(() => setVideoShown(true), 1600)
  }

  function toggleMute() {
    const next = !muted
    setYouTubeMuted(frameRef.current, next)
    setMuted(next)
  }

  function openInfo(e) {
    if (!modal || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    modal.open(movie)
  }

  const inList = isInList(movie)
  const showFrame = allowVideo && trailerKey && onScreen
  const match = movie.vote_average ? `${Math.round(movie.vote_average * 10)}% Match` : null

  return (
    <header className="hero" ref={heroRef}>
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${backdropUrl(movie.backdrop_path, 'original')})` }}
      />

      {showFrame && (
        <iframe
          ref={frameRef}
          className={`hero-video ${videoShown ? 'shown' : ''}`}
          src={trailerEmbedUrl(trailerKey)}
          title={`${movie.title} trailer`}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          onLoad={handleFrameLoad}
        />
      )}

      <div className="hero-fade" />

      <div className="hero-content">
        {rankLabel && (
          <p className="hero-rank">
            <span className="hero-rank-mark" aria-hidden="true">
              TOP
              <br />
              10
            </span>
            <span>{rankLabel}</span>
          </p>
        )}
        <h1 className="hero-title">{movie.title}</h1>
        <p className="hero-meta">
          {match && <span className="hero-match">{match}</span>}
          {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
        </p>
        <p className="hero-overview">{movie.overview}</p>
        <div className="hero-actions">
          <button className="btn btn-play" onClick={() => play(movie)}>
            <Play size={22} fill="currentColor" aria-hidden="true" /> Play
          </button>
          <Link to={itemPath(movie)} onClick={openInfo} className="btn btn-secondary">
            <Info size={22} aria-hidden="true" /> More Info
          </Link>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => toggleList(movie)}
            aria-label={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check size={22} /> : <Plus size={22} />}
          </button>
        </div>
      </div>

      {videoShown && (
        <button
          className="hero-mute circle-btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
    </header>
  )
}
