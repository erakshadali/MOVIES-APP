import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ModalHost from './components/ModalHost.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { PageSkeleton } from './components/Skeleton.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import { useProfile } from './context/ProfileContext.jsx'
import { TitleModalProvider } from './context/TitleModalContext.jsx'
import { hasWelcomed } from './lib/welcome.js'

// Everything except the home page is downloaded only when someone visits it,
// which keeps the first load fast.
const Browse = lazy(() => import('./pages/Browse.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const NewPopular = lazy(() => import('./pages/NewPopular.jsx'))
const MyList = lazy(() => import('./pages/MyList.jsx'))
const TitleDetails = lazy(() => import('./pages/TitleDetails.jsx'))
const Person = lazy(() => import('./pages/Person.jsx'))
const Profiles = lazy(() => import('./pages/Profiles.jsx'))
const Landing = lazy(() => import('./pages/Landing.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Everything except the welcome page and the profile picker needs a chosen profile.
function AppLayout() {
  const { current } = useProfile()
  const location = useLocation()

  if (!current) {
    // first-time visitors see the welcome page; returning ones go straight to profiles
    return (
      <Navigate
        to={hasWelcomed() ? '/profiles' : '/welcome'}
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return (
    <TitleModalProvider>
      <div className="app-shell">
        <Navbar />
        <main key={location.pathname} className="route-fade">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <ModalHost />
    </TitleModalProvider>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
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
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
