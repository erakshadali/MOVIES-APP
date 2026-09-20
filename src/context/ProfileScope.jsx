import { Fragment } from 'react'
import { useProfile } from './ProfileContext.jsx'
import { MyListProvider } from './MyListContext.jsx'
import { ProgressProvider } from './ProgressContext.jsx'
import { RatingsProvider } from './RatingsContext.jsx'
import { PlayerProvider } from './PlayerContext.jsx'

// Everything per-profile lives under a key, so switching profiles remounts
// it with a fresh My List / Continue Watching / ratings.
export default function ProfileScope({ children }) {
  const { current } = useProfile()
  const profileId = current?.id ?? 'none'

  return (
    <Fragment key={profileId}>
      <MyListProvider profileId={profileId}>
        <ProgressProvider profileId={profileId}>
          <RatingsProvider profileId={profileId}>
            <PlayerProvider>{children}</PlayerProvider>
          </RatingsProvider>
        </ProgressProvider>
      </MyListProvider>
    </Fragment>
  )
}
