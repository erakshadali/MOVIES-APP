import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand marquee-heading" onClick={() => setMenuOpen(false)}>
          MOVIE<span>HOUSE</span>
        </NavLink>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={linkClass} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/favorites" className={linkClass} onClick={() => setMenuOpen(false)}>
            Favorites
          </NavLink>
        </nav>

        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark or light mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
