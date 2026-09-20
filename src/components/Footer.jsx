import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer">
        <Link to="/">Home</Link>
        <Link to="/tv">TV Shows</Link>
        <Link to="/movies">Movies</Link>
        <Link to="/new">New &amp; Popular</Link>
        <Link to="/my-list">My List</Link>
        <Link to="/profiles">Profiles</Link>
        <Link to="/welcome">About MovieFlix</Link>
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
          TMDB
        </a>
      </nav>
      <p className="footer-credit">
        This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming
        availability data from JustWatch. Trailers play from YouTube.
      </p>
      <p className="footer-fine">
        MovieFlix is an independent demo project inspired by Netflix’s design and is not affiliated
        with Netflix. It plays trailers only; for full titles, “Watch now” opens the official
        service.
      </p>
    </footer>
  )
}
