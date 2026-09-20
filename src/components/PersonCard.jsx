import { Link } from 'react-router-dom'
import { profileUrl } from '../api/tmdb.js'
import './PersonCard.css'

// An actor / crew member. `subtitle` overrides the default (their department),
// e.g. the character they played.
export default function PersonCard({ person, subtitle }) {
  const line = subtitle ?? person.known_for_department

  return (
    <Link to={`/person/${person.id}`} className="pc">
      <img
        className="pc-photo"
        src={profileUrl(person.profile_path, 'w185')}
        alt=""
        loading="lazy"
      />
      <span className="pc-name">{person.name}</span>
      {line && <span className="pc-line">{line}</span>}
    </Link>
  )
}
