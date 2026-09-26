import { Link } from 'react-router-dom'

export default function NotFound() {
  return <main className="container page-intro"><p className="eyebrow">Lost in the lab</p><h1 className="section-heading">That exhibit is not here.</h1><p>The route may be incomplete or the model may not be supported.</p><Link className="button button-primary" to="/study">Explore Study Hub</Link></main>
}
