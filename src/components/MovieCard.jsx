import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Plus, Check, ThumbsUp, ChevronDown, X } from 'lucide-react'
import { posterUrl, backdropUrl } from '../api/tmdb.js'
import { itemPath, mediaTypeOf } from '../lib/movie.js'
import { canAutoplayPreviews, getTrailerKey, trailerEmbedUrl } from '../lib/trailer.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useRatings } from '../context/RatingsContext.jsx'
import { useTitleModal } from '../context/TitleModalContext.jsx'
import { useGenres } from '../hooks/useGenres.js'
import FadeImg from './FadeImg.jsx'
import './MovieCard.css'

const PREVIEW_DELAY = 900 // ms of hovering before the trailer starts
// The trailer is rendered at a normal player size (YouTube hides its small-player
// title bar and buttons there) and then scaled down to fit the card.
const PREVIEW_BASE = 640
const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

// Works for movies and TV shows.
// variant: 'landscape' (backdrop) | 'poster' | 'top10' (poster with a big rank number)
export default function MovieCard({ movie, variant = 'landscape', rank, progress, onRemove }) {
  const { isInList, toggleList } = useMyList()
  const { play } = usePlayer()
  const { ratingOf, rate } = useRatings()
  const modal = useTitleModal()
  const genreMap = useGenres()

  const type = mediaTypeOf(movie)
  const path = itemPath(movie)
  const isTV = type === 'tv'
  const inList = isInList(movie)
  const liked = ['up', 'love'].includes(ratingOf(movie))
  const image =
    variant === 'landscape' && movie.backdrop_path
      ? backdropUrl(movie.backdrop_path, 'w500')
      : posterUrl(movie.poster_path)
  const genres = (movie.genre_ids || [])
    .slice(0, 3)
    .map((id) => genreMap[id])
    .filter(Boolean)
  const match = movie.vote_average ? `${Math.round(movie.vote_average * 10)}% Match` : null
  const year = movie.release_date?.slice(0, 4)

  // Netflix-style hover preview: after a moment of hovering, the trailer plays
  // silently right inside the card.
  const [preview, setPreview] = useState({ key: null, visible: false })
  const hoverToken = useRef(0)
  const hoverTimer = useRef(null)
  const thumbRef = useRef(null)

  function startPreview() {
    if (variant !== 'landscape' || !canHover() || !canAutoplayPreviews()) return
    clearTimeout(hoverTimer.current)
    const token = ++hoverToken.current
    hoverTimer.current = setTimeout(async () => {
      const key = await getTrailerKey(type, movie.id)
      if (token === hoverToken.current && key) setPreview({ key, visible: false })
    }, PREVIEW_DELAY)
  }

  function stopPreview() {
    hoverToken.current += 1
    clearTimeout(hoverTimer.current)
    setPreview({ key: null, visible: false })
  }

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  // a normal click opens the pop-up; ctrl/cmd/middle-click still open the page in a new tab
  function handleOpen(e) {
    if (!modal || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    stopPreview()
    modal.open(movie)
  }

  return (
    <article className={`mc mc-${variant}`}>
      {variant === 'top10' && (
        <span className="mc-rank" aria-hidden="true">
          {rank}
        </span>
      )}

      <div className="mc-inner" onMouseEnter={startPreview} onMouseLeave={stopPreview}>
        <Link
          to={path}
          ref={thumbRef}
          onClick={handleOpen}
          className="mc-thumb"
          aria-label={`${movie.title} — more info`}
        >
          <FadeImg src={image} alt="" loading="lazy" />
          {preview.key && (
            <iframe
              className={`mc-preview ${preview.visible ? 'is-on' : ''}`}
              style={{
                width: PREVIEW_BASE,
                height: (PREVIEW_BASE * 9) / 16,
                transform: `translate(-50%, -50%) scale(${((thumbRef.current?.clientWidth || 260) / PREVIEW_BASE) * 1.3})`,
              }}
              src={trailerEmbedUrl(preview.key, { loop: false })}
              title=""
              tabIndex={-1}
              allow="autoplay; encrypted-media"
              onLoad={() =>
                setTimeout(() => setPreview((p) => (p.key ? { ...p, visible: true } : p)), 1800)
              }
            />
          )}
          {preview.key && <span className="mc-preview-mask" aria-hidden="true" />}
          {isTV && <span className="mc-badge">SERIES</span>}
          <span className="mc-caption">{movie.title}</span>
          {progress > 0 && (
            <span className="mc-progress">
              <span style={{ width: `${Math.min(progress, 100)}%` }} />
            </span>
          )}
        </Link>

        <div className="mc-info">
          <div className="mc-actions">
            <button
              className="mc-btn mc-btn-play"
              onClick={() => play(movie)}
              aria-label={`Play trailer for ${movie.title}`}
            >
              <Play size={16} fill="currentColor" />
            </button>
            <button
              className={`mc-btn ${inList ? 'is-on' : ''}`}
              onClick={() => toggleList(movie)}
              aria-label={
                inList ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`
              }
            >
              {inList ? <Check size={16} /> : <Plus size={16} />}
            </button>
            <button
              className={`mc-btn ${liked ? 'is-on' : ''}`}
              onClick={() => rate(movie, 'up')}
              aria-label={liked ? `Remove your like for ${movie.title}` : `I like ${movie.title}`}
              aria-pressed={liked}
            >
              <ThumbsUp size={15} />
            </button>
            {onRemove && (
              <button
                className="mc-btn"
                onClick={() => onRemove(movie)}
                aria-label={`Remove ${movie.title} from Continue Watching`}
              >
                <X size={16} />
              </button>
            )}
            <Link
              to={path}
              onClick={handleOpen}
              className="mc-btn mc-btn-more"
              aria-label={`More info about ${movie.title}`}
            >
              <ChevronDown size={18} />
            </Link>
          </div>
          <h3 className="mc-title">{movie.title}</h3>
          <p className="mc-meta">
            {match && <span className="mc-match">{match}</span>}
            {year && <span>{year}</span>}
            {isTV && <span className="mc-type">Series</span>}
          </p>
          {genres.length > 0 && <p className="mc-genres">{genres.join(' • ')}</p>}
        </div>
      </div>
    </article>
  )
}
