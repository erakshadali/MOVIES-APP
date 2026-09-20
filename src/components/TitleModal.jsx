import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
} from 'lucide-react'
import {
  getDetails,
  backdropUrl,
  posterUrl,
  youtubeTrailerKey,
  movieCertification,
  tvCertification,
} from '../api/tmdb.js'
import { itemKey, itemPath } from '../lib/movie.js'
import { defaultRegion } from '../lib/region.js'
import { bestWatchOption, pickWatchRegion } from '../lib/watch.js'
import { canAutoplayPreviews, setYouTubeMuted, trailerEmbedUrl } from '../lib/trailer.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useRatings } from '../context/RatingsContext.jsx'
import { useTitleModal } from '../context/TitleModalContext.jsx'
import SeasonsSection from './SeasonsSection.jsx'
import FadeImg from './FadeImg.jsx'
import { Skeleton } from './Skeleton.jsx'
import './TitleModal.css'

// A smaller version of the details page that opens over whatever you were
// browsing, like Netflix. The title id lives in the URL (?title=movie-550).
export default function TitleModal() {
  const [params] = useSearchParams()
  const match = (params.get('title') || '').match(/^(movie|tv)-(\d+)$/)
  if (!match) return null
  // keyed, so opening a different title from inside starts fresh at the top
  return <ModalContent key={match[0]} type={match[1]} id={match[2]} />
}

function SimilarCard({ item, onOpen }) {
  const { isInList, toggleList } = useMyList()
  const inList = isInList(item)
  const image = item.backdrop_path
    ? backdropUrl(item.backdrop_path, 'w500')
    : posterUrl(item.poster_path)
  const match = item.vote_average ? `${Math.round(item.vote_average * 10)}% Match` : null

  return (
    <article className="tm-sim">
      <button
        className="tm-sim-thumb"
        onClick={() => onOpen(item)}
        aria-label={`${item.title} — more info`}
      >
        <FadeImg src={image} alt="" loading="lazy" />
        <span className="tm-sim-title">{item.title}</span>
      </button>
      <div className="tm-sim-body">
        <div className="tm-sim-meta">
          <span className="tm-match">{match}</span>
          <span>{item.release_date?.slice(0, 4)}</span>
          <button
            className="circle-btn tm-sim-add"
            onClick={() => toggleList(item)}
            aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
          >
            {inList ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
        {item.overview && <p className="tm-sim-overview">{item.overview}</p>}
      </div>
    </article>
  )
}

function ModalContent({ type, id }) {
  const modal = useTitleModal()
  const { isInList, toggleList } = useMyList()
  const { play } = usePlayer()
  const { ratingOf, rate } = useRatings()
  const region = useMemo(defaultRegion, [])
  const isTV = type === 'tv'

  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const [videoShown, setVideoShown] = useState(false)
  const [muted, setMuted] = useState(true)
  const dialogRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getDetails(type, id)
      .then((data) => !cancelled && setDetails(data))
      .catch((err) => !cancelled && setError(err.message || 'Could not load this title.'))
    return () => {
      cancelled = true
    }
  }, [type, id])

  // lock the page behind, focus the dialog, close on Escape
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e) => {
      // the trailer player has its own Escape handling and sits on top of this
      if (e.key === 'Escape' && !document.querySelector('.player-overlay')) modal?.close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [modal])

  function toggleMute() {
    const next = !muted
    setYouTubeMuted(frameRef.current, next)
    setMuted(next)
  }

  const close = () => modal?.close()
  const rating = details ? ratingOf(details) : null

  let body = null
  if (error) {
    body = <p className="tm-error">{error}</p>
  } else if (!details) {
    body = (
      <>
        <Skeleton className="tm-skel-hero" />
        <div className="tm-body">
          <div className="tm-skel-lines">
            <Skeleton className="skel-line skel-line-mid" />
            <Skeleton className="skel-line skel-line-long" />
            <Skeleton className="skel-line skel-line-long" />
          </div>
        </div>
      </>
    )
  } else {
    const trailerKey = youtubeTrailerKey(details.videos)
    const showFrame = trailerKey && canAutoplayPreviews()
    const backdrop = backdropUrl(details.backdrop_path, 'w1280')
    const match = details.vote_average ? Math.round(details.vote_average * 10) : null
    const cert = isTV ? tvCertification(details, region) : movieCertification(details, region)
    const runtime = isTV
      ? details.episode_run_time?.[0] || details.last_episode_to_air?.runtime
      : details.runtime
    const providerRegions = details['watch/providers']?.results || {}
    const watchOption = bestWatchOption(
      providerRegions[pickWatchRegion(providerRegions, region)],
      details.title
    )

    const crew = details.credits?.crew || []
    const directors = [...new Set(crew.filter((c) => c.job === 'Director').map((c) => c.name))]
    const creators = details.created_by || []
    const rawCast = isTV ? details.aggregate_credits?.cast : details.credits?.cast
    const cast = (rawCast || []).slice(0, 8)

    const more = [
      ...(details.recommendations?.results || []),
      ...(details.similar?.results || []),
    ]
    const similar = [...new Map(more.map((m) => [itemKey(m), m])).values()]
      .filter((m) => m.poster_path || m.backdrop_path)
      .slice(0, 12)

    const inList = isInList(details)

    body = (
      <>
        <div className="tm-hero">
          {backdrop ? (
            <img className="tm-hero-img" src={backdrop} alt="" />
          ) : (
            <div className="tm-hero-img" />
          )}
          {showFrame && (
            <iframe
              ref={frameRef}
              className={`tm-hero-video ${videoShown ? 'is-on' : ''}`}
              src={trailerEmbedUrl(trailerKey)}
              title={`${details.title} trailer`}
              tabIndex={-1}
              allow="autoplay; encrypted-media"
              onLoad={() => setTimeout(() => setVideoShown(true), 1500)}
            />
          )}
          <div className="tm-hero-fade" />
          <div className="tm-hero-content">
            <h2 className="tm-title">{details.title}</h2>
            <div className="tm-actions">
              <button className="btn btn-play" onClick={() => play(details)}>
                <Play size={20} fill="currentColor" aria-hidden="true" /> Play
              </button>
              {watchOption && (
                <a
                  className="btn btn-primary"
                  href={watchOption.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {watchOption.label} <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
              <button
                className={`circle-btn ${inList ? 'is-on' : ''}`}
                onClick={() => toggleList(details)}
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
                aria-pressed={inList}
              >
                {inList ? <Check size={20} /> : <Plus size={20} />}
              </button>
              <div className="tm-rate" role="group" aria-label="Rate this title">
                <button
                  className={`circle-btn ${rating === 'down' ? 'is-on' : ''}`}
                  onClick={() => rate(details, 'down')}
                  aria-label="Not for me"
                  aria-pressed={rating === 'down'}
                >
                  <ThumbsDown size={18} />
                </button>
                <button
                  className={`circle-btn ${rating === 'up' ? 'is-on' : ''}`}
                  onClick={() => rate(details, 'up')}
                  aria-label="I like this"
                  aria-pressed={rating === 'up'}
                >
                  <ThumbsUp size={18} />
                </button>
                <button
                  className={`circle-btn ${rating === 'love' ? 'is-on' : ''}`}
                  onClick={() => rate(details, 'love')}
                  aria-label="Love this"
                  aria-pressed={rating === 'love'}
                >
                  <Heart size={18} />
                </button>
              </div>
              {videoShown && (
                <button
                  className="circle-btn tm-mute"
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="tm-body">
          <div className="tm-main">
            <p className="tm-meta">
              {match != null && <span className="tm-match">{match}% Match</span>}
              {details.release_date && <span>{details.release_date.slice(0, 4)}</span>}
              {cert && <span className="tm-cert">{cert}</span>}
              {isTV && details.number_of_seasons > 0 && (
                <span>
                  {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                </span>
              )}
              {!isTV && runtime > 0 && (
                <span>
                  {Math.floor(runtime / 60)}h {runtime % 60}m
                </span>
              )}
              <span className="tm-cert">HD</span>
            </p>
            {details.tagline && <p className="tm-tagline">{details.tagline}</p>}
            <p className="tm-overview">{details.overview}</p>
          </div>
          <dl className="tm-side">
            {cast.length > 0 && (
              <div>
                <dt>Cast:</dt>
                <dd>
                  {cast.slice(0, 4).map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ', '}
                      <Link to={`/person/${c.id}`} className="inline-link">
                        {c.name}
                      </Link>
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {details.genres?.length > 0 && (
              <div>
                <dt>Genres:</dt>
                <dd>{details.genres.map((g) => g.name).join(', ')}</dd>
              </div>
            )}
          </dl>
        </div>

        {isTV && (
          <div className="tm-section">
            <SeasonsSection key={details.id} tvId={details.id} seasons={details.seasons} />
          </div>
        )}

        {similar.length > 0 && (
          <section className="tm-section">
            <h3 className="tm-h3">More Like This</h3>
            <div className="tm-grid">
              {similar.map((item) => (
                <SimilarCard key={itemKey(item)} item={item} onOpen={(i) => modal?.open(i)} />
              ))}
            </div>
          </section>
        )}

        <section className="tm-section tm-about">
          <h3 className="tm-h3">
            About <strong>{details.title}</strong>
          </h3>
          <dl>
            {creators.length > 0 && (
              <div>
                <dt>Created by:</dt>
                <dd>{creators.map((c) => c.name).join(', ')}</dd>
              </div>
            )}
            {directors.length > 0 && (
              <div>
                <dt>Director:</dt>
                <dd>{directors.join(', ')}</dd>
              </div>
            )}
            {cast.length > 0 && (
              <div>
                <dt>Cast:</dt>
                <dd>{cast.map((c) => c.name).join(', ')}</dd>
              </div>
            )}
            {details.genres?.length > 0 && (
              <div>
                <dt>Genres:</dt>
                <dd>{details.genres.map((g) => g.name).join(', ')}</dd>
              </div>
            )}
            {cert && (
              <div>
                <dt>Maturity rating:</dt>
                <dd>{cert}</dd>
              </div>
            )}
          </dl>
        </section>

        <div className="tm-foot">
          <Link to={itemPath(details)} className="btn btn-outline">
            See full details
          </Link>
        </div>
      </>
    )
  }

  return (
    <div
      className="tm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className="tm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={details?.title || 'Title details'}
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className="tm-close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>
        {body}
      </div>
    </div>
  )
}
