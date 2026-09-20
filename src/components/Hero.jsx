import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { backdropUrl, getVideos, youtubeTrailerKey } from '../api/tmdb.js'
import { itemPath, mediaTypeOf } from '../lib/movie.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import './Hero.css'

// Autoplaying a muted trailer is heavy on phones and unwelcome with reduced
// motion, so those get the still backdrop only.
const allowVideo =
  typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !window.matchMedia('(max-width: 720px)').matches

export default function Hero({ movie }) {
  const { play } = usePlayer()
  const { isInList, toggleList } = useMyList()
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
    getVideos(mediaTypeOf(movie), movie.id)
      .then((data) => !cancelled && setTrailerKey(youtubeTrailerKey(data)))
      .catch(() => {})
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
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute', args: [] }),
      '*'
    )
    setMuted(next)
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
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&fs=0&enablejsapi=1`}
          title={`${movie.title} trailer`}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          onLoad={handleFrameLoad}
        />
      )}

      <div className="hero-fade" />

      <div className="hero-content">
        <h1 className="hero-title">{movie.title}</h1>
        <p className="hero-meta">
          {match && <span className="hero-match">{match}</span>}
          {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
        </p>
        <p className="hero-overview">{movie.overview}</p>
        <div className="hero-actions">
          <button className="btn btn-play" onClick={() => play(movie)}>
            <span aria-hidden="true">▶</span> Play
          </button>
          <Link to={itemPath(movie)} className="btn btn-secondary">
            <span aria-hidden="true">ⓘ</span> More Info
          </Link>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => toggleList(movie)}
            aria-label={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? '✓' : '+'}
          </button>
        </div>
      </div>

      {videoShown && (
        <button
          className="hero-mute"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </header>
  )
}
