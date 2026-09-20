import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import NewPopular from './pages/NewPopular.jsx'
import MyList from './pages/MyList.jsx'
import TitleDetails from './pages/TitleDetails.jsx'
import Person from './pages/Person.jsx'
import Profiles from './pages/Profiles.jsx'
import { useProfile } from './context/ProfileContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Everything except the profile picker needs a chosen profile.
function AppLayout() {
  const { current } = useProfile()
  const location = useLocation()

  if (!current) {
    return <Navigate to="/profiles" replace state={{ from: location.pathname + location.search }} />
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/profiles" element={<Profiles />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          {/* keyed so genre ids / filters never leak between the movie and TV pages */}
          <Route path="/movies" element={<Browse key="movie" mediaType="movie" />} />
          <Route path="/tv" element={<Browse key="tv" mediaType="tv" />} />
          <Route path="/browse" element={<Navigate to="/movies" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/new" element={<NewPopular />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/movie/:id" element={<TitleDetails key="movie" mediaType="movie" />} />
          <Route path="/tv/:id" element={<TitleDetails key="tv" mediaType="tv" />} />
          <Route path="/person/:id" element={<Person />} />
          <Route path="*" element={<p className="state-message">Page not found.</p>} />
        </Route>
      </Routes>
    </>
  )
}
