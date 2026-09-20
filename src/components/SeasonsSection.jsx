import { useEffect, useMemo, useState } from 'react'
import { getSeason, stillUrl } from '../api/tmdb.js'
import { formatDate } from '../lib/region.js'
import './SeasonsSection.css'

// Season picker + episode list for a TV show. Parent should give it
// key={tvId} so it resets when navigating between shows.
export default function SeasonsSection({ tvId, seasons }) {
  // real seasons in order, "Specials" (season 0) last
  const list = useMemo(
    () =>
      (seasons || [])
        .filter((s) => s.episode_count > 0)
        .sort((a, b) => {
          if (a.season_number === 0) return 1
          if (b.season_number === 0) return -1
          return a.season_number - b.season_number
        }),
    [seasons]
  )

  const [selected, setSelected] = useState(list[0]?.season_number)
  const [cache, setCache] = useState({}) // season number -> season data | { error: true }

  useEffect(() => {
    if (selected == null || cache[selected]) return
    let cancelled = false
    getSeason(tvId, selected)
      .then((data) => !cancelled && setCache((prev) => ({ ...prev, [selected]: data })))
      .catch(() => !cancelled && setCache((prev) => ({ ...prev, [selected]: { error: true } })))
    return () => {
      cancelled = true
    }
  }, [selected, tvId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (list.length === 0) return null

  const season = cache[selected]
  const seasonName = (s) => (s.season_number === 0 ? 'Specials' : s.name || `Season ${s.season_number}`)

  return (
    <section className="seasons-section">
      <div className="seasons-head">
        <h2 className="details-section-title">Episodes</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          aria-label="Choose a season"
        >
          {list.map((s) => (
            <option key={s.id} value={s.season_number}>
              {seasonName(s)} ({s.episode_count} ep.)
            </option>
          ))}
        </select>
      </div>

      {!season && <p className="seasons-note">Loading episodes…</p>}
      {season?.error && <p className="seasons-note">Couldn’t load this season.</p>}

      {season?.episodes && (
        <>
          {season.overview && <p className="season-overview">{season.overview}</p>}
          <ol className="episode-list">
            {season.episodes.map((ep) => (
              <li className="episode" key={ep.id}>
                <span className="episode-number">{ep.episode_number}</span>
                <span className="episode-still">
                  {stillUrl(ep.still_path) ? (
                    <img src={stillUrl(ep.still_path)} alt="" loading="lazy" />
                  ) : (
                    <span className="episode-still-empty" />
                  )}
                </span>
                <div className="episode-body">
                  <div className="episode-top">
                    <h3>{ep.name}</h3>
                    {ep.runtime > 0 && <span className="episode-runtime">{ep.runtime}m</span>}
                  </div>
                  <p className="episode-meta">
                    {ep.air_date && <span>{formatDate(ep.air_date)}</span>}
                    {ep.vote_average > 0 && <span>★ {ep.vote_average.toFixed(1)}</span>}
                  </p>
                  {ep.overview && <p className="episode-overview">{ep.overview}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
