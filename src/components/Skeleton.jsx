import './Skeleton.css'

// Grey shimmering placeholders that hold the shape of the page while data
// loads, instead of a spinner on a blank screen.
export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}

export function RowSkeleton({ count = 8, variant = 'landscape' }) {
  return (
    <section className="skel-row" role="status" aria-label="Loading">
      <Skeleton className="skel-row-title" />
      <div className="skel-row-scroll">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className={`skel-card skel-${variant}`} />
        ))}
      </div>
    </section>
  )
}

export function HeroSkeleton() {
  return (
    <div className="skel-hero" role="status" aria-label="Loading">
      <div className="skel-hero-copy">
        <Skeleton className="skel-line skel-line-title" />
        <Skeleton className="skel-line skel-line-long" />
        <Skeleton className="skel-line skel-line-mid" />
        <div className="skel-hero-btns">
          <Skeleton className="skel-btn" />
          <Skeleton className="skel-btn" />
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="skel-page" role="status" aria-label="Loading">
      <Skeleton className="skel-line skel-line-title" />
      <RowSkeleton count={6} />
    </div>
  )
}

export function DetailsSkeleton() {
  return (
    <div className="skel-details" role="status" aria-label="Loading">
      <Skeleton className="skel-poster" />
      <div className="skel-details-copy">
        <Skeleton className="skel-line skel-line-title" />
        <Skeleton className="skel-line skel-line-mid" />
        <Skeleton className="skel-line skel-line-long" />
        <Skeleton className="skel-line skel-line-long" />
        <Skeleton className="skel-line skel-line-mid" />
      </div>
    </div>
  )
}
