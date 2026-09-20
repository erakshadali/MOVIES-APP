import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './GenreMenu.css'

// The "Genres" menu at the top of the Movies and TV Shows pages: a button that
// opens a panel of genre names in columns, like Netflix.
export default function GenreMenu({ genres, value, onChange, label = 'Genres' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = genres.find((g) => String(g.id) === String(value))

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(id) {
    setOpen(false)
    onChange(id)
  }

  return (
    <div className="gm" ref={rootRef}>
      <button
        className={`gm-btn ${current ? 'is-active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {current ? current.name : label}
        <ChevronDown size={16} aria-hidden="true" className={open ? 'gm-flip' : ''} />
      </button>

      {open && (
        <div className="gm-panel" role="menu" aria-label="Choose a genre">
          <button
            role="menuitem"
            className={`gm-item gm-all ${!current ? 'is-current' : ''}`}
            onClick={() => choose('')}
          >
            All genres
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              role="menuitem"
              className={`gm-item ${String(g.id) === String(value) ? 'is-current' : ''}`}
              onClick={() => choose(String(g.id))}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
