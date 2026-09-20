import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Home,
  Tv,
  Film,
  Flame,
  Bookmark,
  ChevronDown,
  Pencil,
  Info,
  Users,
  X,
} from 'lucide-react'
import { useProfile } from '../context/ProfileContext.jsx'
import { useDismiss } from '../hooks/useDismiss.js'
import Notifications from './Notifications.jsx'
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
  const [browseOpen, setBrowseOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const urlQuery = params.get('q') || ''
  const [query, setQuery] = useState(urlQuery)

  const onSearch = location.pathname === '/search'
  const searchInputRef = useRef(null)
  const profileRef = useRef(null)
  const browseRef = useRef(null)

  useDismiss(profileRef, profileOpen, () => setProfileOpen(false))
  useDismiss(browseRef, browseOpen, () => setBrowseOpen(false))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close menus whenever the route changes
  useEffect(() => {
    setProfileOpen(false)
    setBrowseOpen(false)
  }, [location.pathname])

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
    setProfileOpen(false)
    setBrowseOpen(false)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  function handleSearchBlur() {
    // clicking the clear button blurs the field first; keep the box open then
    setTimeout(() => {
      if (document.activeElement !== searchInputRef.current && !query.trim()) setSearchOpen(false)
    }, 120)
  }

  function clearSearch() {
    setQuery('')
    searchInputRef.current?.focus()
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
  const activeLink = LINKS.find((l) =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
  )

  return (
    <>
      <header className={`navbar ${scrolled ? 'solid' : ''} ${searchOpen ? 'searching' : ''}`}>
        <Link to="/" className="brand" aria-label="MovieFlix home">
          MOVIEFLIX
        </Link>

        {/* wide screens: all the links in a row */}
        <nav className="nav-links" aria-label="Main">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* mid-size screens: the same links folded into a "Browse" menu, like Netflix */}
        <div className="browse-menu" ref={browseRef}>
          <button
            className="browse-btn"
            onClick={() => setBrowseOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={browseOpen}
          >
            {activeLink?.label || 'Browse'}
            <ChevronDown size={16} aria-hidden="true" className={browseOpen ? 'flip' : ''} />
          </button>
          {browseOpen && (
            <div className="dropdown browse-dropdown" role="menu">
              <span className="dd-arrow dd-arrow-left" aria-hidden="true" />
              {LINKS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={linkClass} role="menuitem">
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

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
            {searchOpen && query && (
              <button className="search-clear" onClick={clearSearch} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>

          <Notifications />

          <div className="profile-menu" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label={`Profile menu for ${current?.name}`}
            >
              <span className="avatar" style={{ backgroundColor: current?.color }}>
                {current?.name?.[0]?.toUpperCase()}
              </span>
              <ChevronDown size={16} aria-hidden="true" className={`caret ${profileOpen ? 'flip' : ''}`} />
            </button>
            {profileOpen && (
              <div className="dropdown profile-dropdown" role="menu">
                <span className="dd-arrow" aria-hidden="true" />
                {profiles
                  .filter((p) => p.id !== current?.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => selectProfile(p.id)}
                    >
                      <span className="avatar small" style={{ backgroundColor: p.color }}>
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
                  <Pencil size={18} aria-hidden="true" /> Manage Profiles
                </Link>
                <div className="dd-sep" />
                <Link to="/welcome" className="dropdown-item" role="menuitem">
                  <Info size={18} aria-hidden="true" /> About MovieFlix
                </Link>
                <Link to="/profiles" className="dropdown-item" role="menuitem">
                  <Users size={18} aria-hidden="true" /> Switch Profile
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
