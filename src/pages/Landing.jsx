import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Play,
  Check,
  Plus,
  ThumbsUp,
  Smartphone,
  Tablet,
  Laptop,
  Tv,
  ExternalLink,
} from 'lucide-react'
import { getTrending, posterUrl, backdropUrl } from '../api/tmdb.js'
import { markWelcomed } from '../lib/welcome.js'
import { useProfile } from '../context/ProfileContext.jsx'
import FadeImg from '../components/FadeImg.jsx'
import Footer from '../components/Footer.jsx'
import './Landing.css'

const SERVICES = [
  'Netflix',
  'Prime Video',
  'Apple TV',
  'Disney+',
  'JioHotstar',
  'Hulu',
  'YouTube',
  'Google Play',
]

const FAQ = [
  {
    q: 'What is MovieFlix?',
    a: 'MovieFlix is a Netflix-style guide to movies and TV shows. Browse what is trending, watch trailers, build your own list, and see which service carries each title in your country. All the film information comes from TMDB.',
  },
  {
    q: 'Can I watch full movies here?',
    a: 'No. MovieFlix plays trailers and clips. For the full film or episode, the “Watch now” button opens the official service (Netflix, Prime Video, Apple TV and others) where it is available in your country.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing. MovieFlix is free and you do not need an account to start. Pick a profile and go.',
  },
  {
    q: 'Where is my list saved?',
    a: 'In your browser, separately for each profile: My List, your thumbs up and down, and where you stopped a trailer. Accounts that keep everything in sync across your devices are planned.',
  },
  {
    q: 'What can I use it on?',
    a: 'Any modern phone, tablet, laptop or TV browser. On a phone you can add it to your home screen and it opens like an app.',
  },
  {
    q: 'Is MovieFlix connected to Netflix?',
    a: 'No. It is an independent project inspired by Netflix’s design, and it is not affiliated with or endorsed by Netflix.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { current } = useProfile()
  const [titles, setTitles] = useState([])

  useEffect(() => {
    let cancelled = false
    getTrending('all', 'week')
      .then((data) => !cancelled && setTitles(data.results.filter((t) => t.poster_path)))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function start() {
    markWelcomed()
    navigate(current ? '/' : '/profiles')
  }

  const wall = titles.slice(0, 30)
  const showcase = titles.find((t) => t.backdrop_path)

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-wall" aria-hidden="true">
          {wall.map((t) => (
            <FadeImg key={`${t.media_type}-${t.id}`} src={posterUrl(t.poster_path, 'w342')} alt="" />
          ))}
        </div>
        <div className="lp-shade" />

        <header className="lp-top">
          <span className="brand">MOVIEFLIX</span>
          <Link
            to={current ? '/' : '/profiles'}
            onClick={markWelcomed}
            className="btn btn-primary lp-signin"
          >
            {current ? 'Open App' : 'Choose Profile'}
          </Link>
        </header>

        <div className="lp-copy">
          <h1>Discover movies and TV shows.</h1>
          <p className="lp-sub">Watch trailers, save what you love, and find where to stream it.</p>
          <p className="lp-free">Free to use. No account needed to start.</p>
          <button className="btn btn-primary lp-cta" onClick={start}>
            Get Started <ChevronRight size={26} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-band-copy">
          <h2>Trailers on every screen.</h2>
          <p>
            Hover a card and its trailer plays. Open a title for the full trailer, cast, episodes and
            more like it, without leaving the page you were on.
          </p>
        </div>
        <div className="lp-visual" aria-hidden="true">
          <div className="lp-screen">
            {showcase && <FadeImg src={backdropUrl(showcase.backdrop_path, 'w780')} alt="" />}
            <div className="lp-screen-fade" />
            <span className="lp-screen-play">
              <Play size={30} fill="currentColor" />
            </span>
            <span className="lp-screen-chip">Trailer</span>
            <span className="lp-screen-bar">
              <span />
            </span>
          </div>
        </div>
      </section>

      <section className="lp-band lp-band-flip">
        <div className="lp-band-copy">
          <h2>Build your own list.</h2>
          <p>
            Add anything to My List, give it a thumbs up, and MovieFlix starts suggesting “Because
            you liked…” and top picks made for your profile.
          </p>
        </div>
        <div className="lp-visual" aria-hidden="true">
          <div className="lp-fan">
            {titles.slice(3, 6).map((t, i) => (
              <div className={`lp-fan-card lp-fan-${i}`} key={t.id}>
                <FadeImg src={posterUrl(t.poster_path, 'w342')} alt="" />
                <span className="lp-fan-badge">{i === 1 ? <ThumbsUp size={16} /> : i === 0 ? <Check size={16} /> : <Plus size={16} />}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-band-copy">
          <h2>Find where to watch.</h2>
          <p>
            Every title lists the services that carry it in your country to stream, rent or buy, with
            a one-click “Watch now” to the official site.
          </p>
        </div>
        <div className="lp-visual" aria-hidden="true">
          <ul className="lp-services">
            {SERVICES.map((s) => (
              <li key={s}>
                {s} <ExternalLink size={14} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-band lp-band-flip">
        <div className="lp-band-copy">
          <h2>Made for every screen.</h2>
          <p>
            A bottom tab bar on your phone, a roomy layout on tablets, and big trailers on desktop
            and TV. Add it to your home screen and it opens like an app.
          </p>
        </div>
        <div className="lp-visual" aria-hidden="true">
          <div className="lp-devices">
            <Smartphone size={54} strokeWidth={1.4} />
            <Tablet size={78} strokeWidth={1.4} />
            <Laptop size={104} strokeWidth={1.4} />
            <Tv size={130} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      <section className="lp-faq">
        <h2>Frequently asked questions</h2>
        <div className="lp-faq-list">
          {FAQ.map((item) => (
            <details key={item.q} className="lp-faq-item">
              <summary>
                <span>{item.q}</span>
                <Plus size={28} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <p className="lp-again">Ready to explore?</p>
        <button className="btn btn-primary lp-cta" onClick={start}>
          Get Started <ChevronRight size={26} aria-hidden="true" />
        </button>
      </section>

      <Footer />
    </div>
  )
}
