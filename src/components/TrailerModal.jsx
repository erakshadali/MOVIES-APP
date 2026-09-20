import './TrailerModal.css'

export default function TrailerModal({ url, onClose }) {
  if (!url) return null

  return (
    <div className="trailer-overlay" onClick={onClose}>
      <div className="trailer-box" onClick={(e) => e.stopPropagation()}>
        <button className="trailer-close" onClick={onClose} aria-label="Close trailer">
          ✕
        </button>
        <iframe
          src={`${url}?autoplay=1`}
          title="Movie trailer"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
