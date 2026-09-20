import { useMemo, useState } from 'react'
import './VideosSection.css'

// Trailers, teasers, clips and featurettes. Clicking one plays it in the player.
export default function VideosSection({ videos, onPlay }) {
  const types = useMemo(() => {
    const counts = new Map()
    videos.forEach((v) => counts.set(v.type, (counts.get(v.type) || 0) + 1))
    return [...counts.entries()] // already in "best kinds first" order
  }, [videos])

  const [selected, setSelected] = useState(types[0]?.[0])
  const shown = videos.filter((v) => v.type === selected).slice(0, 12)

  if (videos.length === 0) return null

  return (
    <section className="videos-section">
      <h2 className="details-section-title">Videos</h2>

      {types.length > 1 && (
        <div className="video-tabs" role="tablist">
          {types.map(([type, count]) => (
            <button
              key={type}
              role="tab"
              aria-selected={selected === type}
              className={`video-tab ${selected === type ? 'active' : ''}`}
              onClick={() => setSelected(type)}
            >
              {type} <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="video-scroll">
        {shown.map((video) => (
          <button
            key={video.key}
            className="video-card"
            onClick={() => onPlay(video.key)}
            aria-label={`Play ${video.name}`}
          >
            <span className="video-thumb">
              <img
                src={`https://i.ytimg.com/vi/${video.key}/mqdefault.jpg`}
                alt=""
                loading="lazy"
              />
              <span className="video-play" aria-hidden="true">
                ▶
              </span>
            </span>
            <span className="video-name">{video.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
