import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard.jsx'
import PersonCard from './PersonCard.jsx'
import { itemKey } from '../lib/movie.js'
import './MovieRow.css'

// variant: 'landscape' | 'poster' | 'top10' | 'person'
// progressFor(item) -> 0..100, onRemove(item): optional, for Continue Watching
export default function MovieRow({ title, movies, variant = 'landscape', progressFor, onRemove }) {
  const scrollRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  function updateEdges() {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [movies])

  function scrollByPage(direction) {
    const el = scrollRef.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  if (!movies || movies.length === 0) return null

  return (
    <section className="row" aria-label={title}>
      <h2 className="row-title">{title}</h2>
      <div className="row-frame">
        <button
          className="row-arrow row-arrow-left"
          onClick={() => scrollByPage(-1)}
          hidden={atStart}
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft size={34} />
        </button>
        <div className="row-scroll" ref={scrollRef} onScroll={updateEdges}>
          {movies.map((item, i) => (
            <div
              className={`row-item row-item-${variant}`}
              key={variant === 'person' ? item.id : itemKey(item)}
            >
              {variant === 'person' ? (
                <PersonCard person={item} subtitle={item.subtitle} />
              ) : (
                <MovieCard
                  movie={item}
                  variant={variant}
                  rank={i + 1}
                  progress={progressFor?.(item)}
                  onRemove={onRemove}
                />
              )}
            </div>
          ))}
        </div>
        <button
          className="row-arrow row-arrow-right"
          onClick={() => scrollByPage(1)}
          hidden={atEnd}
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight size={34} />
        </button>
      </div>
    </section>
  )
}
