import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPerson, normalize, profileUrl } from '../api/tmdb.js'
import { itemKey, itemPath } from '../lib/movie.js'
import { ageFrom, formatDate } from '../lib/region.js'
import { DetailsSkeleton } from '../components/Skeleton.jsx'
import MovieRow from '../components/MovieRow.jsx'
import './Person.css'

const BIO_PREVIEW = 700
// talk shows and news appearances shouldn't count as someone's "known for"
const NOT_KNOWN_FOR = [10767, 10763]

export default function Person() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bioOpen, setBioOpen] = useState(false)
  const [department, setDepartment] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setPerson(null)
    setBioOpen(false)
    getPerson(id)
      .then((data) => {
        if (cancelled) return
        setPerson(data)
        setDepartment(data.known_for_department || '')
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load this person.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  // Every credit as a normalised title plus what the person did on it,
  // grouped by department ("Acting", "Directing", "Writing", …).
  const credits = useMemo(() => {
    const grouped = new Map()
    if (!person) return grouped
    const add = (dept, entry, role) => {
      const item = { ...normalize(entry), role: role || '', popularity: entry.popularity || 0 }
      const list = grouped.get(dept) || []
      // one line per title per department, joining multiple roles/jobs
      const existing = list.find((c) => itemKey(c) === itemKey(item))
      if (existing) {
        if (role && !existing.role.includes(role)) existing.role += `, ${role}`
      } else {
        list.push(item)
      }
      grouped.set(dept, list)
    }
    const { cast = [], crew = [] } = person.combined_credits || {}
    cast
      .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
      .forEach((c) => add('Acting', c, c.character))
    crew
      .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
      .forEach((c) => add(c.department, c, c.job))
    return grouped
  }, [person])

  if (loading) return <DetailsSkeleton />
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
  if (!person) return null

  // their main department first, then the rest by number of credits
  const departments = [...credits.entries()]
    .sort(
      (a, b) =>
        Number(b[0] === person.known_for_department) - Number(a[0] === person.known_for_department) ||
        b[1].length - a[1].length
    )
    .map(([name, list]) => [name, list.length])
  const currentDepartment = credits.has(department) ? department : departments[0]?.[0]

  // "Known for": the best-known work in the person's main department
  const mainList = credits.get(person.known_for_department) || credits.get('Acting') || []
  const knownFor = [...mainList]
    .filter((c) => c.poster_path && !c.genre_ids.some((g) => NOT_KNOWN_FOR.includes(g)))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 16)

  const filmography = [...(credits.get(currentDepartment) || [])].sort((a, b) =>
    (b.release_date || '9999').localeCompare(a.release_date || '9999')
  )

  const age = ageFrom(person.birthday, person.deathday)
  const bio = (person.biography || '').trim()
  const bioShown = bioOpen || bio.length <= BIO_PREVIEW ? bio : `${bio.slice(0, BIO_PREVIEW).trimEnd()}…`
  const photos = person.images?.profiles?.slice(0, 12) || []
  const ids = person.external_ids || {}

  const facts = [
    ['Known for', person.known_for_department],
    [
      'Born',
      person.birthday
        ? `${formatDate(person.birthday)}${person.deathday ? '' : age != null ? ` (age ${age})` : ''}`
        : '',
    ],
    [
      'Died',
      person.deathday
        ? `${formatDate(person.deathday)}${age != null ? ` (aged ${age})` : ''}`
        : '',
    ],
    ['Birthplace', person.place_of_birth],
    ['Also known as', person.also_known_as?.slice(0, 4).join(', ')],
    ['Credits', String([...credits.values()].reduce((sum, list) => sum + list.length, 0))],
  ].filter(([, value]) => value && value !== '0')

  return (
    <div className="person-page">
      <div className="container person-content">
        <Link to="/" className="back-link">
          ← Back
        </Link>

        <div className="person-grid-layout">
          <aside className="person-side">
            <img
              className="person-photo"
              src={profileUrl(person.profile_path, 'h632')}
              alt={person.name}
            />
            <dl className="person-facts">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="person-links">
              {ids.imdb_id && (
                <a href={`https://www.imdb.com/name/${ids.imdb_id}/`} target="_blank" rel="noreferrer">
                  IMDb ↗
                </a>
              )}
              {ids.instagram_id && (
                <a href={`https://www.instagram.com/${ids.instagram_id}/`} target="_blank" rel="noreferrer">
                  Instagram ↗
                </a>
              )}
              {ids.twitter_id && (
                <a href={`https://x.com/${ids.twitter_id}`} target="_blank" rel="noreferrer">
                  X ↗
                </a>
              )}
              {person.homepage && (
                <a href={person.homepage} target="_blank" rel="noreferrer">
                  Website ↗
                </a>
              )}
            </div>
          </aside>

          <div className="person-main">
            <h1 className="person-name">{person.name}</h1>

            <h2 className="details-section-title person-h2">Biography</h2>
            {bio ? (
              <div className="person-bio">
                {bioShown.split(/\n+/).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {bio.length > BIO_PREVIEW && (
                  <button className="link-button" onClick={() => setBioOpen((open) => !open)}>
                    {bioOpen ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <p className="person-bio-empty">We don’t have a biography for {person.name}.</p>
            )}
          </div>
        </div>
      </div>

      <div className="person-rows">
        <MovieRow title="Known For" movies={knownFor} variant="poster" />
      </div>

      <div className="container person-content person-lower">
        {departments.length > 0 && (
          <section>
            <div className="filmography-head">
              <h2 className="details-section-title person-h2">Filmography</h2>
              <div className="segmented" role="group" aria-label="Filter by department">
                {departments.map(([name, count]) => (
                  <button
                    key={name}
                    className={`segment ${currentDepartment === name ? 'active' : ''}`}
                    onClick={() => setDepartment(name)}
                    aria-pressed={currentDepartment === name}
                  >
                    {name} ({count})
                  </button>
                ))}
              </div>
            </div>

            <ul className="filmography">
              {filmography.map((credit) => (
                <li key={itemKey(credit)} className="film-row">
                  <span className="film-year">{credit.release_date?.slice(0, 4) || '—'}</span>
                  <span className="film-main">
                    <Link to={itemPath(credit)} className="film-title">
                      {credit.title}
                    </Link>
                    {credit.media_type === 'tv' && <span className="film-tag">TV</span>}
                    {credit.role && <span className="film-role">as {credit.role}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {photos.length > 1 && (
          <section>
            <h2 className="details-section-title person-h2">Photos</h2>
            <div className="person-photos">
              {photos.map((photo) => (
                <img
                  key={photo.file_path}
                  src={profileUrl(photo.file_path, 'w342')}
                  alt={`${person.name}`}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
