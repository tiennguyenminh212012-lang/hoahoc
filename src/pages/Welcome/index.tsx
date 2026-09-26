import { useEffect, useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SceneViewport } from '../../scenes/shared/SceneViewport'
import { AtomScene } from '../../scenes/atom/AtomScene'
import { useProgress } from '../../app/store/progress'
import './welcome.css'

const stageLabels = ['Particles gather', 'Nucleus forms', 'Electron probability appears', 'Explore chemistry']

export default function Welcome() {
  const motion = useProgress((state) => state.motion)
  const quality = useProgress((state) => state.quality)
  const setMotion = useProgress((state) => state.setMotion)
  const [stage, setStage] = useState(motion === 'reduced' ? 4 : 0)

  useEffect(() => {
    if (motion === 'reduced') return
    if (stage >= 4) return
    const timer = window.setTimeout(() => setStage((current) => Math.min(current + 1, 4)), stage === 0 ? 450 : 620)
    return () => window.clearTimeout(timer)
  }, [stage, motion])

  return (
    <main className={`welcome welcome-stage-${stage}`}>
      <div className="welcome-noise" aria-hidden="true" />
      <div className="welcome-content container">
        <div className="welcome-topline"><span className="eyebrow">Interactive science exhibition</span><span className="welcome-chapter">001 / Matter begins here</span></div>
        <div className="welcome-scene-wrap">
          <SceneViewport label="Interactive sodium atom learning model" quality={quality} reducedMotion={motion === 'reduced'} cameraPosition={[0, 0, 5.5]} showQualitySelector={false} showControls={false} className="welcome-scene" fallback={<div className="welcome-fallback" role="img" aria-label="Sodium atom with a nucleus and electron probability cloud"><span>Na</span><p>11 protons · 12 neutrons · 11 electrons</p></div>}>
            <AtomScene atomicNumber={11} massNumber={23} symbol="Na" shellElectrons={[2, 8, 1]} mode="cloud" formation={motion === 'reduced' ? 1 : Math.min(1, stage / 3)} />
          </SceneViewport>
          <div className="welcome-stage-caption" aria-live="polite"><span className="welcome-stage-line" />{stageLabels[Math.max(0, Math.min(stage - 1, 3))]}</div>
        </div>
        <div className="welcome-title-block">
          <p className="welcome-kicker">Look closer. Think deeper.</p>
          <h1 className="display">CHEMISTRY</h1>
          <p className="welcome-subtitle">A hands-on journey through atoms, bonds, and reactions.</p>
          <div className="welcome-actions">
            <Link className="button button-primary" to="/study">Study <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="button" to="/models">3D Model <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="welcome-bottomline"><p>Learning visualization — particle sizes and distances are not to scale.</p><div>{stage < 4 && motion !== 'reduced' && <button type="button" className="welcome-text-button" onClick={() => setStage(4)}><SkipForward size={16} aria-hidden="true" /> Skip intro</button>}<button type="button" className="welcome-text-button" onClick={() => { setMotion(motion === 'reduced' ? 'full' : 'reduced'); setStage(4) }}>{motion === 'reduced' ? 'Full motion' : 'Reduced motion'}</button></div></div>
      </div>
    </main>
  )
}
