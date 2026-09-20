import { createContext, useContext, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { itemKey } from '../lib/movie.js'

// The title pop-up lives in the address bar as ?title=movie-550, so the back
// button closes it, refreshing keeps it open, and the link can be shared.
// This context only hands out stable open/close functions, so the hundreds of
// cards on a page don't re-render whenever the pop-up opens.
const TitleModalContext = createContext(null)

export function TitleModalProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  locationRef.current = location

  const actions = useMemo(
    () => ({
      open(item) {
        const loc = locationRef.current
        const params = new URLSearchParams(loc.search)
        const alreadyOpen = params.has('title')
        params.set('title', itemKey(item))
        // moving from one pop-up to another replaces the entry, so Back closes it
        navigate(
          { pathname: loc.pathname, search: `?${params.toString()}` },
          { replace: alreadyOpen, state: { modal: true } }
        )
      },
      close() {
        const loc = locationRef.current
        if (loc.state?.modal) {
          navigate(-1)
          return
        }
        // opened from a shared link: there is no earlier entry to go back to
        const params = new URLSearchParams(loc.search)
        params.delete('title')
        const search = params.toString()
        navigate({ pathname: loc.pathname, search: search ? `?${search}` : '' }, { replace: true })
      },
    }),
    [navigate]
  )

  return <TitleModalContext.Provider value={actions}>{children}</TitleModalContext.Provider>
}

// null outside the provider, so a card there simply follows its normal link
export function useTitleModal() {
  return useContext(TitleModalContext)
}
