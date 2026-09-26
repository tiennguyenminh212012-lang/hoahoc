import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProgress } from '../../app/store/progress'
import { getElement } from '../../chemistry-data/elements'
import { getIsotopeForElement } from '../../chemistry-data/isotopes'
import { getReaction } from '../../chemistry-data/reactions'
import { InspectorPanel } from '../../components/inspector/InspectorPanel'
import { AtomScene } from '../../scenes/atom/AtomScene'
import { BondingScene } from '../../scenes/bonding/BondingScene'
import { MoleculeScene } from '../../scenes/molecules/MoleculeScene'
import { ReactionScene } from '../../scenes/reactions/ReactionScene'
import { SceneViewport } from '../../scenes/shared/SceneViewport'
import type { AtomView } from '../../scenes/types'
import { getModel } from '../ModelGallery/models'
import { bondLessons } from '../BondingLab/lessonData'
import './model-viewer.css'

type SelectionInfo = { title: string; summary: string; role?: string; why?: string; changed?: string }

export default function ModelViewer() {
  const { modelId = '' } = useParams()
  const [params] = useSearchParams()
  const model = getModel(modelId)
  const quality = useProgress((state) => state.quality)
  const motion = useProgress((state) => state.motion)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [step, setStep] = useState(model?.bondingStep ?? 0)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const requestedView = params.get('view')
  const [atomView, setAtomView] = useState<AtomView>(requestedView === 'shell' || requestedView === 'nucleus' ? requestedView : 'cloud')

  useEffect(() => { setSelection(null); setStep(model?.bondingStep ?? 0); setProgress(0); setPlaying(false); setAtomView(requestedView === 'shell' || requestedView === 'nucleus' ? requestedView : 'cloud') }, [modelId, model?.bondingStep, requestedView])

  useEffect(() => {
    if (!playing || !model) return
    const timer = window.setInterval(() => {
      if (model.kind === 'bonding' && model.bondingExample) setStep((current) => { const last = bondLessons[model.bondingExample!].steps.length - 1; if (current >= last) { setPlaying(false); return last } return current + 1 })
      if (model.kind === 'reaction') setProgress((current) => { if (current >= 1) { setPlaying(false); return 1 } return Math.min(1, current + .25) })
    }, motion === 'reduced' ? 1500 : 1100)
    return () => window.clearInterval(timer)
  }, [playing, model, motion])

  if (!model) return <main className="container page-intro"><p className="eyebrow">Model unavailable</p><h1 className="section-heading">No model here.</h1><p>That model is not part of this gallery.</p><Link className="button button-primary" to="/models">Back to models</Link></main>

  const returnTo = params.get('returnTo')
  const returnUrl = returnTo === 'atoms' ? `/study/atoms?element=${encodeURIComponent(params.get('element') ?? String(model.atomNumber ?? 11))}&view=${atomView}` : returnTo === 'bonding' ? `/study/bonding?mode=${encodeURIComponent(params.get('mode') ?? 'ionic')}&example=${encodeURIComponent(params.get('example') ?? 'nacl')}&step=${encodeURIComponent(params.get('step') ?? '0')}` : returnTo === 'reactions' ? `/study/reactions?reaction=${encodeURIComponent(params.get('reaction') ?? model.reactionId ?? 'water-synthesis')}` : '/models'
  const relatedLesson = model.kind === 'atom' ? model.relatedLesson.replace(/&view=[^&]*/, `&view=${atomView}`) : model.relatedLesson
  const reaction = model.reactionId ? getReaction(model.reactionId) : undefined
  const atom = model.atomNumber ? getElement(model.atomNumber) : undefined
  const isotope = model.atomNumber ? getIsotopeForElement(model.atomNumber) : undefined
  const isTimeline = model.kind === 'bonding' || model.kind === 'reaction'
  const currentStage = model.kind === 'reaction' ? Math.round(progress * 4) : step
  const lastStage = model.kind === 'reaction' ? 4 : model.bondingExample ? bondLessons[model.bondingExample].steps.length - 1 : 0
  const stepBack = () => { setPlaying(false); if (model.kind === 'reaction') setProgress((value) => Math.max(0, value - .25)); else setStep((value) => Math.max(0, value - 1)) }
  const stepForward = () => { setPlaying(false); if (model.kind === 'reaction') setProgress((value) => Math.min(1, value + .25)); else setStep((value) => Math.min(lastStage, value + 1)) }
  const replay = () => { if (model.kind === 'reaction') setProgress(0); else setStep(0); setPlaying(true) }

  return <main className="container viewer-page">
    <div className="viewer-crumb"><Link to={returnUrl} className="page-back"><ArrowLeft size={16} aria-hidden="true" /> {returnTo ? 'Return to lesson' : '3D Gallery'}</Link><span className="eyebrow">{model.category} / Interactive model</span></div>
    <div className="viewer-heading"><div><h1 className="section-heading">{model.name}</h1><p>{model.description}</p></div><Link className="button button-subtle" to={relatedLesson}>Open Related Lesson <ArrowRight size={16} aria-hidden="true" /></Link></div>
    <div className="viewer-workspace">
      <section className="viewer-stage" aria-label={`${model.name} interactive 3D view`}>
        <div className="viewer-stage-label"><span>{model.formula}</span><span>Drag to rotate · scroll or pinch to zoom</span></div>
        {model.kind === 'atom' && <div className="viewer-atom-modes" role="group" aria-label="Atom display mode"><button type="button" aria-pressed={atomView === 'cloud'} onClick={() => { setAtomView('cloud'); setSelection(null) }}>Probability cloud</button><button type="button" aria-pressed={atomView === 'shell'} onClick={() => { setAtomView('shell'); setSelection(null) }}>Basic electron shells</button><button type="button" aria-pressed={atomView === 'nucleus'} onClick={() => { setAtomView('nucleus'); setSelection(null) }}>Nucleus</button></div>}
        <SceneViewport label={model.name} quality={quality} reducedMotion={motion === 'reduced'} showQualitySelector={false} fallback={<div className="viewer-fallback"><div>{model.formula}</div><p>Interactive 3D is unavailable on this device, so this exhibit uses a labeled view.</p><p>{model.description}</p></div>}>
          {model.kind === 'atom' && atom && isotope && <AtomScene atomicNumber={atom.atomicNumber} massNumber={isotope.massNumber} symbol={atom.symbol} shellElectrons={isotope.shellArrangement} mode={atomView} onSelect={(item) => setSelection(item.kind === 'nucleus' ? { title: 'Nucleus', summary: `${isotope.protons} protons and ${isotope.neutrons} neutrons make mass number ${isotope.massNumber}.`, role: 'The nucleus holds almost all the atom’s mass.' } : item.kind === 'proton' ? { title: 'Proton', summary: 'A positively charged particle in the nucleus.', role: `${atom.name} has ${isotope.protons} protons.` } : item.kind === 'neutron' ? { title: 'Neutron', summary: 'An uncharged particle in the nucleus.', role: `${atom.name}-${isotope.massNumber} has ${isotope.neutrons} neutrons.` } : { title: 'Electron region', summary: atomView === 'shell' ? `Basic shell arrangement: ${isotope.shellArrangement.join(', ')}. The rings show energy levels, not electron paths.` : 'The cloud shows probability of finding an electron, not a fixed orbit.' })} />}
          {model.kind === 'molecule' && model.preset && <MoleculeScene model={model.preset} onSelect={(item) => setSelection(item.kind === 'atom' ? { title: `${item.element} atom`, summary: `This ${item.element} atom is part of ${model.name}.`, role: model.description } : { title: 'Covalent bond', summary: 'A bond joins atoms through shared electrons.', role: model.description })} />}
          {model.kind === 'bonding' && model.bondingExample && <BondingScene example={model.bondingExample} step={step} onSelect={(item) => setSelection({ title: item.kind === 'lattice' ? 'Ionic lattice' : item.kind === 'electron' ? 'Electron' : item.kind === 'bond' ? 'Bond' : item.kind === 'ion' ? 'Ion' : 'Atom', summary: model.description, role: `Selected object: ${item.id}.` })} />}
          {model.kind === 'reaction' && reaction && <ReactionScene reactionId={reaction.id} reactants={reaction.reactants} products={reaction.products} progress={progress} onSelectGroup={(item) => setSelection({ title: item.side === 'change-zone' ? 'Reaction zone' : item.side === 'reactants' ? 'Reactants' : 'Products', summary: item.side === 'change-zone' ? 'Atoms are rearranged into new combinations; their nuclei keep their identities.' : item.side === 'reactants' ? 'These substances enter the reaction.' : 'These substances form after the reaction.', role: item.formula ? `${item.formula} is part of this side.` : reaction.explanation })} />}
        </SceneViewport>
        {isTimeline && <div className="viewer-timeline" role="group" aria-label="Model timeline"><button type="button" aria-label="Previous step" onClick={stepBack} disabled={currentStage <= 0}><StepBack size={18} /></button><button type="button" aria-label={playing ? 'Pause model' : 'Play model'} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18} /> : <Play size={18} />}</button><button type="button" aria-label="Next step" onClick={stepForward} disabled={currentStage >= lastStage}><StepForward size={18} /></button><button type="button" aria-label="Replay model" onClick={replay}><RotateCcw size={18} /></button><span>Step {currentStage + 1} / {lastStage + 1}</span></div>}
      </section>
      <InspectorPanel title={selection?.title ?? model.name} symbol={model.formula} summary={selection?.summary ?? model.description} role={selection?.role ?? 'Select a part of the model to inspect it.'} why={selection?.why ?? (model.kind === 'atom' ? atomView === 'shell' ? 'These rings group electrons by energy level for learning. Real electrons do not circle on fixed tracks.' : atomView === 'nucleus' ? 'Protons and neutrons occupy a tiny central region. The diagram enlarges the nucleus so you can inspect it.' : 'Electron clouds are probability regions; the particles and distances shown here are not to scale.' : undefined)} changed={selection?.changed} className="viewer-inspector" source={{ label: 'OpenStax chemistry', url: model.kind === 'atom' ? 'https://openstax.org/books/chemistry/pages/6-3-development-of-quantum-theory' : model.kind === 'reaction' ? 'https://openstax.org/books/chemistry/pages/4-2-classifying-chemical-reactions' : 'https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds' }} />
    </div>
    {model.kind === 'atom' && isotope && <p className="viewer-atom-note">{atomView === 'shell' ? `Basic shells: ${isotope.shellArrangement.join(', ')} electrons. Rings show energy levels for learning; electrons do not travel on these exact paths.` : atomView === 'cloud' ? 'Probability cloud: brighter regions show where electrons are more likely to be found.' : 'The nucleus is enlarged for inspection. Particle sizes and distances are not to scale.'}</p>}
    <p className="footer-note viewer-note">Educational model. Atom sizes, distances, and reaction timing are simplified to help explain the chemistry.</p>
  </main>
}
