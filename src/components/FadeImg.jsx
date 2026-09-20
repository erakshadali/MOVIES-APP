import { useEffect, useRef, useState } from 'react'

// An <img> that fades in when it has loaded (and is visible straight away if the
// browser already had it cached).
export default function FadeImg({ className = '', alt = '', ...props }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true)
  }, [])

  return (
    <img
      ref={ref}
      alt={alt}
      {...props}
      className={`fade-img ${loaded ? 'is-loaded' : ''} ${className}`.trim()}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  )
}
