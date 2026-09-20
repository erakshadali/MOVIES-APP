import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { profiles, current, selectProfile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
    setMenuOpen(false)
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
    }
  }

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <header className={`navbar ${scrolled || menuOpen ? 'solid' : ''}`}>
      <Link to="/" className="brand">
        MOVIEFLIX
      </Link>

      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/tv" className={linkClass}>
          TV Shows
        </NavLink>
        <NavLink to="/movies" className={linkClass}>
          Movies
        </NavLink>
        <NavLink to="/new" className={linkClass}>
          New &amp; Popular
        </NavLink>
        <NavLink to="/my-list" className={linkClass}>
          My List
        </NavLink>
      </nav>

      <div className="navbar-actions">
        <div className={`search-box ${searchOpen ? 'open' : ''}`}>
          <button className="icon-btn" onClick={openSearch} aria-label="Search">
            ⌕
          </button>
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            placeholder="Titles, people"
            onChange={(e) => setQuery(e.target.value)}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKey}
            aria-label="Search movies"
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

        <button
          className="hamburger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
