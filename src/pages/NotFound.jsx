import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="nf">
      <p className="nf-code">404</p>
      <h1>Lost your way?</h1>
      <p>Sorry, we can’t find that page. You’ll find lots to explore on the home page.</p>
      <Link to="/" className="btn btn-play">
        MovieFlix Home
      </Link>
    </div>
  )
}
