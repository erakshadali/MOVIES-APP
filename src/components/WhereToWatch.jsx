import { logoUrl } from '../api/tmdb.js'
import { WATCH_GROUPS, hasAvailability, providerLink, regionName } from '../lib/watch.js'
import './WhereToWatch.css'

// "Where to watch": every service that carries the title in the chosen
// country. Each one opens the service's website in a new tab.
export default function WhereToWatch({ title, providerRegions, region, onRegionChange }) {
  const regions = Object.keys(providerRegions)
    .filter((code) => hasAvailability(providerRegions[code]))
    .sort((a, b) => regionName(a).localeCompare(regionName(b)))

  if (regions.length === 0) {
    return (
      <section className="watch">
        <h2 className="details-section-title">Where to watch</h2>
        <p className="watch-empty">
          No streaming, rental or purchase options are listed for this title yet.
        </p>
      </section>
    )
  }

  const data = providerRegions[region]
  const groups = WATCH_GROUPS.filter(([key]) => data?.[key]?.length)

  return (
    <section className="watch">
      <div className="watch-head">
        <h2 className="details-section-title">Where to watch</h2>
        <label className="watch-region">
          <span>Country</span>
          <select value={region} onChange={(e) => onRegionChange(e.target.value)}>
            {regions.map((code) => (
              <option key={code} value={code}>
                {regionName(code)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="watch-empty">Not available in {regionName(region)}. Try another country.</p>
      ) : (
        groups.map(([key, label]) => (
          <div className="watch-group" key={key}>
            <h3 className="watch-label">{label}</h3>
            <ul className="watch-list">
              {data[key].map((provider) => {
                const { url, direct } = providerLink(provider, title, data.link)
                return (
                  <li key={provider.provider_id}>
                    <a
                      className="watch-tile"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={
                        direct
                          ? `Search for “${title}” on ${provider.provider_name}`
                          : `See where to watch “${title}”`
                      }
                    >
                      {logoUrl(provider.logo_path) && (
                        <img src={logoUrl(provider.logo_path)} alt="" loading="lazy" />
                      )}
                      <span>{provider.provider_name}</span>
                      <span className="watch-out" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}

      <p className="watch-note">
        These links open the service’s own website in a new tab. MovieFlix doesn’t stream full
        movies. Availability data from{' '}
        <a href={data?.link} target="_blank" rel="noopener noreferrer" className="inline-link">
          JustWatch
        </a>
        .
      </p>
    </section>
  )
}
