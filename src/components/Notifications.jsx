import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { backdropUrl, getMovieList, posterUrl } from '../api/tmdb.js'
import { itemPath } from '../lib/movie.js'
import { formatDate } from '../lib/region.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { useDismiss } from '../hooks/useDismiss.js'
import { useTitleModal } from '../context/TitleModalContext.jsx'
import { Skeleton } from './Skeleton.jsx'

const today = () => new Date().toISOString().slice(0, 10)

// The bell: what is coming to cinemas soon. The red dot shows until you have
// opened it today.
export default function Notifications() {
  const modal = useTitleModal()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(null)
  const [failed, setFailed] = useState(false)
  const [unread, setUnread] = useState(() => readJSON('mf_notif_seen', '') !== today())

  useDismiss(rootRef, open, () => setOpen(false))

  function load() {
    Promise.all([getMovieList('upcoming'), getMovieList('now_playing')])
      .then(([upcoming, playing]) => {
        const usable = (m) => m.backdrop_path || m.poster_path
        // the "upcoming" list also holds films that have already opened, so split by date
        const coming = upcoming.results
          .filter((m) => usable(m) && m.release_date > today())
          .sort((a, b) => a.release_date.localeCompare(b.release_date))
          .slice(0, 4)
        const shown = new Set(coming.map((m) => m.id))
        const now = [...upcoming.results, ...playing.results]
          .filter((m) => usable(m) && m.release_date <= today() && !shown.has(m.id))
          .sort((a, b) => b.release_date.localeCompare(a.release_date))
        const unique = [...new Map(now.map((m) => [m.id, m])).values()].slice(0, 7 - coming.length)
        setItems([...coming, ...unique])
      })
      .catch(() => setFailed(true))
  }

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      if (!items && !failed) load()
      writeJSON('mf_notif_seen', today())
      setUnread(false)
    }
  }

  function openItem(e, item) {
    if (!modal || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    setOpen(false)
    modal.open(item)
  }

  const when = (item) => {
    if (!item.release_date) return 'Coming soon'
    return item.release_date > today() ? `Coming ${formatDate(item.release_date)}` : `In cinemas · ${formatDate(item.release_date)}`
  }

  return (
    <div className="notif" ref={rootRef}>
      <button
        className="icon-btn bell-btn"
        onClick={toggle}
        aria-label={unread ? 'Notifications, new' : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={22} />
        {unread && <span className="bell-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="dropdown notif-dropdown" role="menu" aria-label="Notifications">
          <span className="dd-arrow" aria-hidden="true" />
          <p className="notif-head">New &amp; coming soon</p>
          {failed && <p className="notif-empty">Couldn’t load right now. Try again in a moment.</p>}
          {!items && !failed && (
            <div className="notif-loading">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="notif-skel" />
              ))}
            </div>
          )}
          {items?.map((item) => (
            <Link
              key={item.id}
              to={itemPath(item)}
              className="notif-item"
              role="menuitem"
              onClick={(e) => openItem(e, item)}
            >
              <img
                src={item.backdrop_path ? backdropUrl(item.backdrop_path, 'w300') : posterUrl(item.poster_path, 'w185')}
                alt=""
                loading="lazy"
              />
              <span className="notif-text">
                <strong>{item.title}</strong>
                <span>{when(item)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
