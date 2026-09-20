import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getDetails,
  getCollection,
  posterUrl,
  backdropUrl,
  logoUrl,
  youtubeVideos,
  movieCertification,
  tvCertification,
} from '../api/tmdb.js'
import { defaultRegion, formatMoney, formatDate } from '../lib/region.js'
import { bestWatchOption, hasAvailability } from '../lib/watch.js'
import { useMyList } from '../context/MyListContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import Loader from '../components/Loader.jsx'
import MovieRow from '../components/MovieRow.jsx'
import VideosSection from '../components/VideosSection.jsx'
import SeasonsSection from '../components/SeasonsSection.jsx'
import WhereToWatch from '../components/WhereToWatch.jsx'
import './TitleDetails.css'

function PersonLinks({ people }) {
  return people.map((person, i) => (
    <span key={person.id}>
      {i > 0 && ', '}
      <Link to={`/person/${person.id}`} className="inline-link">
        {person.name}
      </Link>
    </span>
  ))
}

const uniqueById = (list) => [...new Map(list.map((p) => [p.id, p])).values()]

// One page for both movies and TV shows.
export default function TitleDetails({ mediaType }) {
  const { id } = useParams()
  const isTV = mediaType === 'tv'
  const region = useMemo(defaultRegion, [])

  const [details, setDetails] = useState(null)
  const [collection, setCollection] = useState(null)
  const [watchRegion, setWatchRegion] = useState('') // '' = pick automatically
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isInList, toggleList } = useMyList()
  const { play } = usePlayer()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setDetails(null)
    setCollection(null)
    setWatchRegion('')
    getDetails(mediaType, id)
      .then((data) => !cancelled && setDetails(data))
      .catch((err) => !cancelled && setError(err.message || 'Could not load this title.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [mediaType, id])

  // franchise: "Part of the … Collection"
  const collectionId = details?.belongs_to_collection?.id
  useEffect(() => {
    if (!collectionId) return
    let cancelled = false
    getCollection(collectionId)
      .then((data) => !cancelled && setCollection(data))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [collectionId])

  if (loading) return <Loader />
  if (error) {
    return (
      <div className="state-message error">
        {error}
        <br />
        <Link to="/" className="text-link">
          Back to Home
        </Link>
      </div>
    )
  }
  if (!details) return null

  const inList = isInList(details)
  const backdrop = backdropUrl(details.backdrop_path)
  const videos = youtubeVideos(details.videos)
  const hasTrailer = videos.length > 0

  const crew = details.credits?.crew || []
  const directors = uniqueById(crew.filter((c) => c.job === 'Director'))
  // TV credits only cover the latest season's crew, so "Created by" stands in for them
  const writers = isTV ? [] : uniqueById(crew.filter((c) => c.department === 'Writing')).slice(0, 3)
  const creators = details.created_by || []

  const rawCast = isTV ? details.aggregate_credits?.cast : details.credits?.cast
  const cast = (rawCast || []).slice(0, 16).map((c) => ({
    id: c.id,
    media_type: 'person',
    name: c.name,
    profile_path: c.profile_path,
    subtitle: isTV ? c.roles?.[0]?.character : c.character,
  }))

  const certification = isTV ? tvCertification(details, region) : movieCertification(details, region)
  const runtime = isTV
    ? details.episode_run_time?.[0] || details.last_episode_to_air?.runtime
    : details.runtime
  const keywords = (details.keywords?.keywords || details.keywords?.results || []).slice(0, 10)
  const images = details.images?.backdrops?.slice(0, 8) || []
  const reviews = details.reviews?.results?.slice(0, 4) || []
  const similar = details.similar?.results?.slice(0, 16) || []
  const recommendations = details.recommendations?.results?.slice(0, 16) || []
  const companies = (isTV ? details.networks : details.production_companies)?.filter(
    (c) => c.logo_path
  )

  // Where to watch: the viewer's country if it has options, else the US, else
  // any country that does. The viewer can change it in the section below.
  const providerRegions = details['watch/providers']?.results || {}
  const availableRegions = Object.keys(providerRegions).filter((code) =>
    hasAvailability(providerRegions[code])
  )
  const autoRegion = availableRegions.includes(region)
    ? region
    : availableRegions.includes('US')
      ? 'US'
      : availableRegions[0] || region
  const activeWatchRegion = availableRegions.includes(watchRegion) ? watchRegion : autoRegion
  const watchOption = bestWatchOption(providerRegions[activeWatchRegion], details.title)

  const next = details.next_episode_to_air
  const facts = [
    ['Status', details.status],
    details.original_title || details.original_name
      ? [
          'Original title',
          (details.original_title || details.original_name) !== details.title
            ? details.original_title || details.original_name
            : '',
        ]
      : null,
    ['Language', details.spoken_languages?.[0]?.english_name || details.original_language],
    [
      'Countries',
      (details.production_countries?.map((c) => c.name) || details.origin_country || []).join(', '),
    ],
    isTV ? ['Type', details.type] : null,
    isTV ? ['First aired', formatDate(details.first_air_date)] : null,
    isTV && details.status !== 'Returning Series'
      ? ['Last aired', formatDate(details.last_air_date)]
      : null,
    isTV && next
      ? ['Next episode', `S${next.season_number}E${next.episode_number} · ${formatDate(next.air_date)}`]
      : null,
    isTV && details.networks?.length ? ['Network', details.networks.map((n) => n.name).join(', ')] : null,
    !isTV && details.budget > 0 ? ['Budget', formatMoney(details.budget)] : null,
    !isTV && details.revenue > 0 ? ['Box office', formatMoney(details.revenue)] : null,
  ].filter((fact) => fact && fact[1])

  return (
    <div className="details-page">
      {backdrop && (
        <div className="details-backdrop" style={{ backgroundImage: `url(${backdrop})` }} />
      )}

      <div className="container details-content">
        <Link to="/" className="back-link">
          ← Back
        </Link>

        <div className="details-grid">
          <img
            className="details-poster"
            src={posterUrl(details.poster_path)}
            alt={`${details.title} poster`}
          />

          <div className="details-info">
            <h1 className="marquee-heading">{details.title}</h1>
            {details.tagline && <p className="tagline">{details.tagline}</p>}

            <div className="details-meta">
              {details.vote_count > 0 && (
                <span className="meta-rating">
                  ★ {details.vote_average?.toFixed(1)} ({details.vote_count.toLocaleString()} votes)
                </span>
              )}
              {details.release_date && <span>{details.release_date.slice(0, 4)}</span>}
              {certification && <span className="cert-badge">{certification}</span>}
              {isTV && details.number_of_seasons > 0 && (
                <span>
                  {details.number_of_seasons} season{details.number_of_seasons > 1 ? 's' : ''} ·{' '}
                  {details.number_of_episodes} episodes
                </span>
              )}
              {runtime > 0 && <span>{isTV ? `${runtime} min / ep` : `${runtime} min`}</span>}
            </div>

            <div className="genre-tags">
              {details.genres?.map((g) => (
                <Link
                  key={g.id}
                  to={`/${isTV ? 'tv' : 'movies'}?genre=${g.id}`}
                  className="genre-tag"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="overview">{details.overview}</p>

            {creators.length > 0 && (
              <p className="crew-line">
                <strong>Created by:</strong> <PersonLinks people={creators} />
              </p>
            )}
            {directors.length > 0 && (
              <p className="crew-line">
                <strong>Director:</strong> <PersonLinks people={directors} />
              </p>
            )}
            {writers.length > 0 && (
              <p className="crew-line">
                <strong>Writers:</strong> <PersonLinks people={writers} />
              </p>
            )}

            {keywords.length > 0 && (
              <div className="keyword-tags">
                {keywords.map((k) => (
                  <span key={k.id} className="keyword-tag">
                    {k.name}
                  </span>
                ))}
              </div>
            )}

            <div className="action-row">
              {watchOption && (
                <a
                  className="btn btn-primary"
                  href={watchOption.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {watchOption.label} ↗
                </a>
              )}
              {hasTrailer && (
                <button className="btn btn-play" onClick={() => play(details)}>
                  ▶ Play Trailer
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => toggleList(details)}>
                {inList ? '✓ In My List' : '+ My List'}
              </button>
              {details.external_ids?.imdb_id && (
                <a
                  className="btn btn-outline"
                  href={`https://www.imdb.com/title/${details.external_ids.imdb_id}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  IMDb ↗
                </a>
              )}
              {details.homepage && (
                <a className="btn btn-outline" href={details.homepage} target="_blank" rel="noreferrer">
                  Website ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <WhereToWatch
          key={`watch-${mediaType}-${details.id}`}
          title={details.title}
          providerRegions={providerRegions}
          region={activeWatchRegion}
          onRegionChange={setWatchRegion}
        />

        {facts.length > 0 && (
          <section>
            <h2 className="details-section-title">Details</h2>
            <dl className="facts">
              {facts.map(([label, value]) => (
                <div className="fact" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {companies?.length > 0 && (
              <div className="company-row">
                {companies.slice(0, 8).map((c) => (
                  <span className="company" key={c.id} title={c.name}>
                    <img src={logoUrl(c.logo_path, 'w185')} alt={c.name} loading="lazy" />
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {isTV && <SeasonsSection key={details.id} tvId={details.id} seasons={details.seasons} />}

        <VideosSection
          key={`${mediaType}-${details.id}`}
          videos={videos}
          onPlay={(videoKey) => play(details, { videoKey })}
        />

      </div>

      {/* rows are full-bleed, so they sit outside the centred container */}
      <div className="details-rows">
        <MovieRow title="Cast" movies={cast} variant="person" />
        {collection?.parts?.length > 1 && (
          <MovieRow title={`Part of the ${collection.name}`} movies={collection.parts} />
        )}
      </div>

      <div className="container details-content details-content-lower">
        {images.length > 0 && (
          <section className="gallery-section">
            <h2 className="details-section-title">Photos</h2>
            <div className="gallery-scroll">
              {images.map((img, i) => (
                <img
                  key={img.file_path}
                  src={backdropUrl(img.file_path, 'w780')}
                  alt={`${details.title} still ${i + 1}`}
                  loading="lazy"
                  className="gallery-img"
                />
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="reviews-section">
            <h2 className="details-section-title">Reviews</h2>
            <div className="reviews-list">
              {reviews.map((r) => (
                <div className="review-card" key={r.id}>
                  <div className="review-header">
                    <strong>{r.author}</strong>
                    {r.author_details?.rating && (
                      <span className="review-rating">★ {r.author_details.rating}</span>
                    )}
                  </div>
                  <p className="review-content">
                    {r.content.length > 400 ? `${r.content.slice(0, 400)}…` : r.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="details-rows">
        <MovieRow title="More Like This" movies={similar} />
        <MovieRow title="You Might Also Like" movies={recommendations} />
      </div>
    </div>
  )
}
