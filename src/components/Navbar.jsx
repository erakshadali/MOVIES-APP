import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Home, Tv, Film, Flame, Bookmark } from 'lucide-react'
import { useProfile } from '../context/ProfileContext.jsx'
import './Navbar.css'

const LINKS = [
  { to: '/', label: 'Home', short: 'Home', Icon: Home, end: true },
  { to: '/tv', label: 'TV Shows', short: 'TV', Icon: Tv },
  { to: '/movies', label: 'Movies', short: 'Movies', Icon: Film },
  { to: '/new', label: 'New & Popular', short: 'New', Icon: Flame },
  { to: '/my-list', label: 'My List', short: 'My List', Icon: Bookmark },
]

export default function Navbar() {
  const { profiles, current, selectProfile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const urlQuery = params.get('q') || ''
  const [query, setQuery] = useState(urlQuery)

  const onSearch = location.pathname === '/search'
  const searchInputRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close menus whenever the route changes
  useEffect(() => {
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileOpen) return
    const onClick = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [profileOpen])

  // press "/" anywhere to start searching
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      e.preventDefault()
      openSearch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // live search: update the results page shortly after typing stops
  useEffect(() => {
    if (!searchOpen) return
    const trimmed = query.trim()
    if (trimmed === urlQuery) return
    const timer = setTimeout(() => {
      const target = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search'
      navigate(target, { replace: onSearch })
    }, 350)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  function handleSearchBlur() {
    if (!query.trim()) setSearchOpen(false)
  }

  function handleSearchKey(e) {
    if (e.key === 'Escape') {
      setQuery('')
      setSearchOpen(false)
      e.target.blur()
    }
  }

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')
  const bottomClass = ({ isActive }) => (isActive ? 'bottom-link active' : 'bottom-link')

  return (
    <>
      <header className={`navbar ${scrolled ? 'solid' : ''} ${searchOpen ? 'searching' : ''}`}>
        <Link to="/" className="brand" aria-label="MovieFlix home">
          MOVIEFLIX
        </Link>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          <div className={`search-box ${searchOpen ? 'open' : ''}`}>
            <button className="icon-btn" onClick={openSearch} aria-label="Search">
              <Search size={22} />
            </button>
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              placeholder="Titles, people"
              onChange={(e) => setQuery(e.target.value)}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKey}
              aria-label="Search movies, TV shows and people"
              tabIndex={searchOpen ? 0 : -1}
            />
          </div>

          <div className="profile-menu" ref={profileRef}>
            <button
              className="avatar"
              style={{ background: current?.color }}
              onClick={() => setProfileOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label={`Profile menu for ${current?.name}`}
            >
              {current?.name?.[0]?.toUpperCase()}
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                {profiles
                  .filter((p) => p.id !== current?.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => selectProfile(p.id)}
                    >
                      <span className="avatar small" style={{ background: p.color }}>
                        {p.name[0]?.toUpperCase()}
                      </span>
                      {p.name}
                    </button>
                  ))}
                <Link
                  to="/profiles"
                  state={{ manage: true }}
                  className="dropdown-item"
                  role="menuitem"
                >
                  Manage Profiles
                </Link>
                <Link to="/profiles" className="dropdown-item dropdown-switch" role="menuitem">
                  Switch Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* on phones the main links move to a bottom tab bar, like an app */}
      <nav className="bottom-nav" aria-label="Main">
        {LINKS.map(({ to, short, end, Icon }) => (
          <NavLink key={to} to={to} end={end} className={bottomClass}>
            <Icon size={22} aria-hidden="true" />
            <span>{short}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
