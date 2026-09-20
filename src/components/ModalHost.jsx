import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

// The pop-up's code is only downloaded the first time someone opens a title.
const TitleModal = lazy(() => import('./TitleModal.jsx'))

export default function ModalHost() {
  const [params] = useSearchParams()
  if (!params.get('title')) return null
  return (
    <Suspense fallback={null}>
      <TitleModal />
    </Suspense>
  )
}
