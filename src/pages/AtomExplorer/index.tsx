import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProgress } from '../../app/store/progress'
import { InspectorPanel } from '../../components/inspector/InspectorPanel'
import { elements, getElement } from '../../chemistry-data/elements'
import { getIsotopeForElement } from '../../chemistry-data/isotopes'
import { SceneViewport } from '../../scenes/shared/SceneViewport'
import { AtomScene } from '../../scenes/atom/AtomScene'
import type { AtomSelection, AtomView } from '../../scenes/types'
import './atom-explorer.css'

const quantumSource = { label: 'OpenStax quantum theory', url: 'https://openstax.org/books/chemistry/pages/6-3-development-of-quantum-theory' }
const nuclearSource = { label: 'OpenStax nuclear forces', url: 'https://openstax.org/books/physics/pages/22-2-nuclear-forces-and-radioactivity' }

function inspectorFor(selection: AtomSelection | null, view: AtomView, symbol: string, massNumber: number, protons: number, neutrons: number, electrons: number, valence: number) {
  if (selection?.kind === 'proton') return { title: 'Proton', symbol: 'p⁺', summary: 'A proton carries a positive electrical charge and sits in the nucleus.', role: `${symbol}-${massNumber} has ${protons} proton${protons === 1 ? '' : 's'}. The proton count identifies the element.`, why: 'Protons and neutrons are held together by the short-range strong nuclear force. The faint nucleus halo is an explanatory model, not a literal bond.', source: nuclearSource }
  if (selection?.kind === 'neutron') return { title: 'Neutron', symbol: 'n⁰', summary: 'A neutron has no electrical charge and sits in the nucleus.', role: `${symbol}-${massNumber} has ${neutrons} neutron${neutrons === 1 ? '' : 's'}. Changing the neutron count makes another isotope of the same element.`, why: 'Neutrons contribute to the mass number and help stabilize many nuclei.', source: nuclearSource }
  if (selection?.kind === 'nucleus' || view === 'nucleus') return { title: 'Nucleus', symbol: `${protons}p⁺ · ${neutrons}n⁰`, summary: `The nucleus of ${symbol}-${massNumber} holds ${protons} protons and ${neutrons} neutrons. Together they make mass number ${massNumber}.`, role: 'This compact center contains almost all the atom’s mass.', why: 'The strong nuclear force acts over very short distances and helps bind nucleons. This model enlarges the nucleus so you can inspect it; real sizes are not to scale.', changed: 'The camera moved inward. The atom itself did not change.', source: nuclearSource }
  if (selection?.kind === 'electron') return { title: view === 'shell' ? 'Electron shell' : 'Electron region', symbol: 'e⁻', summary: view === 'shell' ? 'This dot marks an electron in a simplified energy-level diagram. It does not track an electron’s real position.' : 'An electron has a negative charge. The cloud represents where a measurement is more likely to find it.', role: `${symbol} has ${electrons} electrons when neutral; ${valence} ${valence === 1 ? 'is' : 'are'} in its outer shell in the simplified model.`, why: 'Electrons in atoms are described by quantum states and probabilities, not exact circular paths.', source: quantumSource }
  if (view === 'shell') return { title: 'Simplified shell view', symbol: 'n = 1, 2, 3…', summary: 'Rings organize electrons by energy level for learning. They do not show literal travel paths.', role: `The outer shell has ${valence} electron${valence === 1 ? '' : 's'}; these are important in bonding.`, why: 'The real electron distribution is better represented by probability regions called orbitals.', changed: 'Only the teaching view changed. The atom and its electron count stayed the same.', source: quantumSource }
  return { title: 'Electron cloud', symbol: 'e⁻', summary: 'The bright points sample probability density: denser regions mean an electron is more likely to be found there.', role: 'Electron arrangement helps explain why elements form bonds and react.', why: 'A quantum orbital gives a distribution of possible electron positions, rather than a single planetary trajectory.', changed: 'Switch to Simplified Shell View to see an energy-level teaching model of the same atom.', source: quantumSource }
}

export default function AtomExplorer() {
  const [params, setParams] = useSearchParams()
  const lastElement = useProgress((state) => state.lastElement)
  const recentElements = useProgress((state) => state.recentElements)
  const visit = useProgress((state) => state.visit)
  const selectElement = useProgress((state) => state.selectElement)
  const quality = useProgress((state) => state.quality)
  const motion = useProgress((state) => state.motion)
  const requestedNumber = Number(params.get('element') ?? lastElement)
  const atomicNumber = Number.isInteger(requestedNumber) && requestedNumber >= 1 && requestedNumber <= 118 ? requestedNumber : 11
  const element = getElement(atomicNumber)!
  const isotope = getIsotopeForElement(atomicNumber)
  const viewParam = params.get('view')
  const view: AtomView = viewParam === 'shell' || viewParam === 'nucleus' ? viewParam : 'cloud'
  const [selection, setSelection] = useState<AtomSelection | null>(null)
  const [selectedSubshell, setSelectedSubshell] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)

  useEffect(() => { visit('atoms'); selectElement(atomicNumber) }, [atomicNumber, visit, selectElement])
  useEffect(() => { setSelection(null); setSelectedSubshell(undefined) }, [atomicNumber])

  const matches = useMemo(() => elements.filter((item) => `${item.name} ${item.symbol} ${item.atomicNumber}`.toLowerCase().includes(query.toLowerCase().trim())).slice(0, query ? 20 : 12), [query])
  const details = isotope ? inspectorFor(selection, view, element.symbol, isotope.massNumber, isotope.protons, isotope.neutrons, isotope.electrons, isotope.valenceElectrons) : null

  const chooseElement = (number: number) => {
    const next = new URLSearchParams(params)
    next.set('element', String(number))
    const nextIsotope = getIsotopeForElement(number)
    if (nextIsotope) next.set('isotope', String(nextIsotope.massNumber))
    else next.delete('isotope')
    next.set('view', 'cloud')
    setParams(next)
    setPickerOpen(false)
    setQuery('')
  }
  const chooseView = (nextView: AtomView) => {
    const next = new URLSearchParams(params)
    next.set('element', String(atomicNumber))
    if (isotope) next.set('isotope', String(isotope.massNumber))
    next.set('view', nextView)
    setParams(next)
    setSelection(nextView === 'nucleus' ? { kind: 'nucleus' } : null)
    setInspectorOpen(true)
  }
  const handleSelection = (nextSelection: AtomSelection) => {
    setSelection(nextSelection)
    setInspectorOpen(true)
    if (nextSelection.kind === 'nucleus' || nextSelection.kind === 'proton' || nextSelection.kind === 'neutron') {
      const next = new URLSearchParams(params)
      next.set('element', String(atomicNumber))
      next.set('isotope', String(isotope?.massNumber ?? ''))
      next.set('view', 'nucleus')
      setParams(next)
    }
  }

  return (
    <main className="container atom-page">
      <div className="atom-page-head"><Link to="/study" className="page-back"><ArrowLeft size={16} aria-hidden="true" /> Study Hub</Link><span className="eyebrow">01 / Matter</span></div>
      <div className="atom-heading"><div><h1 className="section-heading">Atom Explorer</h1><p>Inspect a nucleus, then switch between a probability cloud and a simplified shell model.</p></div><div className="atom-heading-actions"><Link className="button button-primary" to={`/study/free-area?element=${atomicNumber}`}>Build in Free Area <ArrowRight size={16} aria-hidden="true" /></Link><Link className="button button-subtle" to="/study/periodic-table">Periodic Table <ArrowRight size={16} aria-hidden="true" /></Link></div></div>
      <div className="atom-toolbar surface">
        <div className="atom-picker-wrap"><button type="button" className="atom-current" aria-expanded={pickerOpen} aria-controls="atom-picker" onClick={() => setPickerOpen(!pickerOpen)}><span className="atom-current-symbol">{element.symbol}</span><span><strong>{element.name}</strong><small>{isotope ? `${element.name}-${isotope.massNumber}` : 'Element overview'}</small></span><span aria-hidden="true">⌄</span></button>
          {pickerOpen && <div id="atom-picker" className="atom-picker surface"><label><Search size={17} aria-hidden="true" /><input type="search" placeholder="Search element or number" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus /></label><div className="atom-picker-list">{matches.map((item) => <button type="button" key={item.atomicNumber} onClick={() => chooseElement(item.atomicNumber)}><span>{item.atomicNumber}</span><strong>{item.symbol}</strong>{item.name}{getIsotopeForElement(item.atomicNumber) && <em>3D</em>}</button>)}</div><p>Detailed isotope scenes: Hydrogen-1, Sodium-23, Chlorine-35.</p></div>}
        </div>
        <div className="atom-view-switch" role="group" aria-label="Atom view"><button type="button" aria-pressed={view === 'cloud'} onClick={() => chooseView('cloud')}>Probability Cloud</button><button type="button" aria-pressed={view === 'shell'} onClick={() => chooseView('shell')}>Simplified Shells</button><button type="button" aria-pressed={view === 'nucleus'} onClick={() => chooseView('nucleus')}>Nucleus</button></div>
      </div>
      {recentElements.length > 1 && <div className="recent-elements"><span>Recently viewed</span>{recentElements.slice(0, 5).map((number) => { const item = getElement(number); return item ? <button type="button" key={number} onClick={() => chooseElement(number)}>{item.symbol}</button> : null })}</div>}
      {isotope ? <>
        <div className="atom-workspace">
          <section className="atom-main-visual" aria-label={`${element.name}-${isotope.massNumber} model`}>
            <div className="atom-visual-top"><span>{element.name}-{isotope.massNumber}</span><span>Neutral atom · {isotope.electrons} e⁻</span></div>
            <SceneViewport label={`${element.name}-${isotope.massNumber} atom`} quality={quality} reducedMotion={motion === 'reduced'} cameraPosition={view === 'nucleus' ? [0, 0, 5.3] : [0, 0, 9]} fallback={<div className="atom-2d-fallback"><div className="atom-2d-symbol">{element.symbol}</div><p>{isotope.protons} protons · {isotope.neutrons} neutrons · {isotope.electrons} electrons</p><p>Shell arrangement: {isotope.shellArrangement.join(', ')}</p></div>}>
              <AtomScene atomicNumber={atomicNumber} massNumber={isotope.massNumber} symbol={element.symbol} shellElectrons={isotope.shellArrangement} mode={view} selectedSubshell={selectedSubshell} onSelect={handleSelection} />
            </SceneViewport>
            <p className="atom-model-note">{view === 'cloud' ? 'Each point is a probability sample, not an electron moving along a path.' : view === 'shell' ? 'Rings show energy levels as a teaching model, not exact electron paths.' : 'The nucleus is enlarged for inspection; size and spacing are not to scale.'}</p>
          </section>
          {inspectorOpen && details && <InspectorPanel {...details} className="atom-inspector" onClose={() => setInspectorOpen(false)} detail={<div className="atom-facts"><span>Atomic number <strong>{atomicNumber}</strong></span><span>Mass number <strong>{isotope.massNumber}</strong></span><span>Protons <strong>{isotope.protons}</strong></span><span>Neutrons <strong>{isotope.neutrons}</strong></span><span>Electrons <strong>{isotope.electrons}</strong></span><span>Valence electrons <strong>{isotope.valenceElectrons}</strong></span></div>} />}
          {!inspectorOpen && <button type="button" className="atom-inspector-reopen button" onClick={() => setInspectorOpen(true)}>Open inspector</button>}
        </div>
        <section className="atom-lower"><div className="atom-configuration surface"><span className="eyebrow">Electron configuration</span><h2>{isotope.electronConfiguration}</h2><p>Select a term to highlight its shell or subshell in the model.</p><div className="config-terms" role="group" aria-label="Electron configuration terms">{isotope.electronConfiguration.split(' ').map((term) => <button type="button" key={term} aria-pressed={selectedSubshell === term} onClick={() => { setSelectedSubshell(term); setSelection({ kind: 'electron', shell: Number(term[0]) }); setInspectorOpen(true) }}>{term}</button>)}</div></div><div className="atom-next surface"><span className="eyebrow">Keep exploring</span><h2>See this atom in the gallery</h2><p>Rotate the model freely, then return to this exact lesson view.</p><Link className="button button-primary" to={`/models/${isotope.id}?returnTo=atoms&element=${atomicNumber}&view=${view}`}>Open 3D model <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
      </> : <div className="atom-unsupported surface"><div className="atom-unsupported-symbol">{element.symbol}</div><div><span className="eyebrow">Element overview</span><h2>{element.name}</h2><p>Atomic number {atomicNumber}; displayed atomic mass {element.atomicMass}. A detailed isotope model is available for Hydrogen-1, Sodium-23, and Chlorine-35. Choose one to inspect individual nucleons and electron regions.</p><button type="button" className="button button-primary" onClick={() => chooseElement(11)}>Explore Sodium-23</button></div></div>}
    </main>
  )
}
