import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CircleHelp, Orbit, SlidersHorizontal } from 'lucide-react'
import { useProgress, type GraphicsQuality, type MotionPreference } from '../../app/store/progress'

const titles: Record<string, string> = {
  study: 'Study Hub', atoms: 'Atom Explorer', 'free-area': 'Free Area', 'periodic-table': 'Periodic Table',
  bonding: 'Bonding Lab', 'polyatomic-ions': 'Polyatomic Ions',
  reactions: 'Chemical Reactions', models: '3D Models',
}

export function GlobalHeader() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const title = segments.length ? titles[segments.at(-1) ?? ''] ?? 'Model Viewer' : 'Welcome'
  const [helpOpen, setHelpOpen] = useState(false)
  const quality = useProgress((state) => state.quality)
  const motion = useProgress((state) => state.motion)
  const setQuality = useProgress((state) => state.setQuality)
  const setMotion = useProgress((state) => state.setMotion)

  return (
    <header className="site-header">
      <Link to="/" className="wordmark" aria-label="CHEMISTRY home"><span className="wordmark-mark" aria-hidden="true">C</span>CHEMISTRY</Link>
      <span className="breadcrumb" aria-label="Current page">Explore <span aria-hidden="true">/</span> <strong>{title}</strong></span>
      <span className="header-spacer" />
      <nav className="header-nav" aria-label="Main navigation">
        <NavLink to="/study">Study Hub</NavLink>
        <NavLink to="/models"><Orbit size={15} aria-hidden="true" /> 3D Models</NavLink>
        <button type="button" aria-expanded={helpOpen} aria-controls="site-help" onClick={() => setHelpOpen(!helpOpen)}><CircleHelp size={15} aria-hidden="true" /> Help</button>
      </nav>
      <div className="header-settings" aria-label="Display settings">
        <label><SlidersHorizontal size={15} aria-hidden="true" /><span>Graphics</span><select aria-label="Graphics quality" value={quality} onChange={(event) => setQuality(event.target.value as GraphicsQuality)}><option value="auto">Auto</option><option value="high">High</option><option value="low">Low</option></select></label>
        <label><span>Motion</span><select aria-label="Motion setting" value={motion} onChange={(event) => setMotion(event.target.value as MotionPreference)}><option value="full">Full</option><option value="reduced">Reduced</option></select></label>
      </div>
      {helpOpen && (
        <div id="site-help" className="help-panel surface" role="region" aria-label="Help">
          <h2>Explore at your pace</h2>
          <p>Choose Study for guided lessons or 3D Models to inspect objects directly. Your progress stays on this device.</p>
          <ul><li>Drag to rotate a model; use the visible controls if you prefer.</li><li>Select a particle or model part to read its explanation.</li><li>Switch to reduced motion or low graphics at any time.</li></ul>
        </div>
      )}
    </header>
  )
}
