import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgress } from '../../app/store/progress';
import { Formula } from '../../components/chemistry/Formula';
import { supportedCompounds, type CompoundData } from '../../chemistry-data/compounds';
import { parseFormula } from '../../chemistry/formulaParser';
import { BondingScene } from '../../scenes/bonding/BondingScene';
import { MoleculeScene } from '../../scenes/molecules/MoleculeScene';
import { SceneViewport } from '../../scenes/shared/SceneViewport';
import type { BondingSelection, MoleculePreset } from '../../scenes/types';
import { atomChargeLabels, ionicProducts, valenceElectrons } from './builderData';
import { bondLessons, type BondExample, type BondMode } from './lessonData';
import './BondingLab.css';

type Activity = 'guided' | 'builder';
type AtomToken = { id: number; symbol: string };
type BondAction = 'transfer' | 'share';

const elementNames: Record<string, string> = { H: 'Hydrogen', C: 'Carbon', O: 'Oxygen', Na: 'Sodium', Mg: 'Magnesium', Cl: 'Chlorine', Ca: 'Calcium' };
const examples: BondExample[] = ['nacl', 'hcl', 'h2'];
const moleculePresets: Record<string, MoleculePreset> = { H2: 'h2', HCl: 'hcl', H2O: 'h2o', CH4: 'ch4', CO2: 'co2' };

function sameCounts(left: Record<string, number>, right: Record<string, number>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => (left[key] ?? 0) === (right[key] ?? 0));
}

function countTokens(tokens: AtomToken[]) {
  return tokens.reduce<Record<string, number>>((counts, token) => {
    counts[token.symbol] = (counts[token.symbol] ?? 0) + 1;
    return counts;
  }, {});
}

function BondDiagram({ example, step }: { example: BondExample; step: number }) {
  if (example === 'nacl' && step === 6) {
    return <div className="bond-fallback-lattice" aria-label="Alternating sodium and chloride ion lattice">{Array.from({ length: 16 }, (_, index) => <span key={index} className={index % 2 === Math.floor(index / 4) % 2 ? 'is-sodium' : 'is-chloride'}>{index % 2 === Math.floor(index / 4) % 2 ? 'Na⁺' : 'Cl⁻'}</span>)}</div>;
  }
  const isIonic = example === 'nacl';
  const bonded = isIonic ? step >= 4 : step >= (example === 'h2' ? 2 : 3);
  return <div className={`bond-fallback-diagram ${bonded ? 'is-bonded' : ''}`} aria-label={bondLessons[example].steps[step]?.modelLabel ?? bondLessons[example].title}>
    <span className="bond-fallback-atom">{isIonic ? (step >= 4 ? 'Na⁺' : 'Na') : 'H'}</span>
    <span className="bond-fallback-link">{isIonic ? (step >= 3 ? '→' : '·') : (bonded ? '••' : '·  ·')}</span>
    <span className="bond-fallback-atom">{isIonic ? (step >= 4 ? 'Cl⁻' : 'Cl') : example === 'h2' ? 'H' : 'Cl'}</span>
  </div>;
}

function selectionText(selection: BondingSelection | null, example: BondExample) {
  if (!selection) return null;
  const detail: Record<BondingSelection['kind'], string> = {
    atom: 'An atom is neutral when its protons and electrons balance. Outer electrons determine how it bonds.',
    electron: example === 'nacl' ? 'This outer electron transfers from sodium to chlorine.' : 'This electron contributes to a pair shared between the atoms.',
    ion: 'This charged particle formed after an electron moved. Opposite charges attract.',
    bond: 'The highlighted connection represents the bonding relationship between these atoms.',
    lattice: 'A crystal contains a repeating arrangement of many ions, not isolated NaCl molecules.',
  };
  return detail[selection.kind];
}

function BondFormula({ value }: { value: string }) {
  return <>{value.split(' + ').map((part, index) => {
    const charge = part.endsWith('⁺') ? 1 : part.endsWith('⁻') ? -1 : undefined;
    const formula = charge === undefined ? part : part.slice(0, -1);
    return <span key={`${part}-${index}`}>{index > 0 && <span className="bond-formula-plus"> + </span>}<Formula formula={formula} charge={charge} /></span>;
  })}</>;
}

function GuidedLesson({ example, step, onStepChange }: { example: BondExample; step: number; onStepChange: (step: number) => void }) {
  const quality = useProgress((state) => state.quality);
  const motion = useProgress((state) => state.motion);
  const completeStep = useProgress((state) => state.completeStep);
  const lesson = bondLessons[example];
  const current = lesson.steps[step] ?? lesson.steps[0]!;
  const last = lesson.steps.length - 1;
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [selection, setSelection] = useState<BondingSelection | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const electronRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { setPlaying(false); setSelection(null); }, [example]);
  useEffect(() => { setSelection(null); }, [step]);
  useEffect(() => {
    if (!playing) return;
    if (step >= last || (example === 'nacl' && step === 2)) { setPlaying(false); return; }
    const timer = window.setTimeout(() => onStepChange(step + 1), slow ? 4400 : 2700);
    return () => window.clearTimeout(timer);
  }, [example, last, onStepChange, playing, slow, step]);
  useEffect(() => {
    if (example !== 'nacl' || step !== 3) return;
    const timer = window.setTimeout(() => onStepChange(4), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 220 : slow ? 2400 : 1200);
    return () => window.clearTimeout(timer);
  }, [example, onStepChange, slow, step]);
  useEffect(() => { completeStep('bonding', step + 1); }, [completeStep, step]);

  function transfer() { if (example === 'nacl' && step === 2) onStepChange(3); }
  function beginPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current || !electronRef.current) return;
    const x = event.clientX - dragStart.current.x;
    const y = event.clientY - dragStart.current.y;
    electronRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }
  function pointerTransfer(event: React.PointerEvent<HTMLButtonElement>) {
    const box = dropRef.current?.getBoundingClientRect();
    dragStart.current = null;
    if (electronRef.current) electronRef.current.style.transform = '';
    if (box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) transfer();
  }

  return <div className="bond-guided-grid">
    <div className="bond-main-column">
      <div className="bond-scene-frame">
        <div className="bond-scene-caption"><span>LIVE MODEL / {lesson.mode.toUpperCase()}</span><span>{current.modelLabel}</span></div>
        <SceneViewport label={`${lesson.title}, step ${step + 1}: ${current.title}`} fallback={<BondDiagram example={example} step={step} />} className="bond-scene" quality={quality} reducedMotion={motion === 'reduced'}>
          <BondingScene example={example} step={step} onSelect={setSelection} />
        </SceneViewport>
      </div>
      {example === 'nacl' && step === 2 && <div className="bond-transfer-station" aria-label="Electron transfer interaction">
        <div><strong>Move the electron</strong><p>Drag the electron into chlorine or use the button. Both actions advance the model.</p></div>
        <div className="bond-transfer-targets"><button ref={electronRef} type="button" className="bond-drag-electron" draggable onPointerDown={beginPointerDrag} onPointerMove={movePointerDrag} onPointerUp={pointerTransfer} onPointerCancel={() => { dragStart.current = null; if (electronRef.current) electronRef.current.style.transform = ''; }} onDragStart={(event) => event.dataTransfer.setData('text/plain', 'sodium-electron')} aria-label="Drag sodium's outer electron to chlorine">e⁻</button><span aria-hidden="true">→</span><div ref={dropRef} className="bond-chlorine-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.getData('text/plain') === 'sodium-electron') transfer(); }}>Cl <small>drop here</small></div></div>
        <button type="button" className="bond-primary" onClick={transfer}>Transfer electron →</button>
      </div>}
      <div className="bond-playback" aria-label="Lesson timeline controls">
        <button type="button" onClick={() => onStepChange(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous lesson step">← Previous</button>
        <button type="button" onClick={() => { if (step === last) onStepChange(0); setPlaying((value) => !value); }} disabled={example === 'nacl' && step === 2} aria-label={example === 'nacl' && step === 2 ? 'Transfer electron to continue lesson' : playing ? 'Pause lesson' : 'Play lesson'}>{playing ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={() => { setPlaying(false); onStepChange(Math.min(last, step + 1)); }} disabled={step === last || (example === 'nacl' && step === 2)} aria-label="Next lesson step">Next →</button>
        <button type="button" onClick={() => { setPlaying(false); onStepChange(0); }} aria-label="Replay lesson">Replay</button>
        <button type="button" className={slow ? 'is-active' : ''} aria-pressed={slow} onClick={() => setSlow((value) => !value)}>Slow motion</button>
      </div>
      <div className="bond-step-track" aria-label="Lesson steps">{lesson.steps.map((item, index) => <button key={item.title} type="button" className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} onClick={() => { setPlaying(false); onStepChange(index); }} aria-current={index === step ? 'step' : undefined} aria-label={`Step ${index + 1}: ${item.title}`}><span>{String(index + 1).padStart(2, '0')}</span><i /></button>)}</div>
    </div>
    <aside className="bond-inspector" aria-live="polite">
      <span className="bond-kicker">STEP {String(step + 1).padStart(2, '0')} / {String(lesson.steps.length).padStart(2, '0')}</span>
      <h2>{current.title}</h2>
      <div className="bond-inspector-formula"><BondFormula value={current.formula} />{example === 'hcl' && step === 6 && <span className="bond-polar-formula">H<sup>δ+</sup>—Cl<sup>δ−</sup></span>}</div>
      <p>{current.explanation}</p>
      <div className="bond-what-changed"><span>WHAT CHANGED</span><p>{current.whatChanged}</p></div>
      {selection && <div className="bond-selection"><span>SELECTED / {selection.kind.toUpperCase()}</span><p>{selectionText(selection, example)}</p></div>}
      <details><summary>Why does this happen?</summary><p>{example === 'nacl' ? 'Electrons can move between atoms, leaving ions with opposite charges. Their electrical attraction holds an ionic solid together.' : 'Atoms can lower their energy by sharing electrons. In HCl, chlorine attracts the pair more strongly; in H₂, identical atoms share equally.'}</p></details>
      <p className="bond-scale-note">Learning visualization. Particle sizes and distances are not to scale.</p>
      <a href="https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds" target="_blank" rel="noreferrer">OpenStax bonding reference ↗</a>
    </aside>
  </div>;
}

function BuiltModel({ compound }: { compound: CompoundData }) {
  const quality = useProgress((state) => state.quality);
  const motion = useProgress((state) => state.motion);
  const preset = moleculePresets[compound.formula];
  if (preset) {
    return <div className="bond-result-model"><SceneViewport label={`${compound.name} molecule model`} fallback={<div className="bond-built-fallback"><Formula formula={compound.formula} /><span>{compound.type === 'covalent' ? 'Shared electron bonds' : 'Ionic structure'}</span></div>} quality={quality} reducedMotion={motion === 'reduced'}><MoleculeScene model={preset} showLabels /></SceneViewport></div>;
  }
  if (compound.formula === 'NaCl') {
    return <div className="bond-result-model"><SceneViewport label="Sodium chloride repeating ionic lattice" fallback={<BondDiagram example="nacl" step={6} />} quality={quality} reducedMotion={motion === 'reduced'}><BondingScene example="nacl" step={6} /></SceneViewport></div>;
  }
  const ions = compound.formula === 'MgO' ? ['Mg²⁺', 'O²⁻', 'Mg²⁺', 'O²⁻'] : ['Cl⁻', 'Ca²⁺', 'Cl⁻', 'Cl⁻', 'Ca²⁺', 'Cl⁻'];
  return <div className="bond-ionic-ratio" role="img" aria-label={`${compound.name} ion ratio diagram, not a crystal geometry model`}><span>ION RATIO / REPEATING SOLID</span><div>{ions.map((ion, index) => <b key={index}>{ion}</b>)}</div><p>Ion ratio diagram. The actual solid is an extended ionic lattice.</p></div>;
}

function CompoundBuilder() {
  const [guided, setGuided] = useState(true);
  const [targetId, setTargetId] = useState('water');
  const [tokens, setTokens] = useState<AtomToken[]>([]);
  const [showValence, setShowValence] = useState(false);
  const [action, setAction] = useState<BondAction>('share');
  const [built, setBuilt] = useState<CompoundData | null>(null);
  const [feedback, setFeedback] = useState('Add atoms, arrange them, then choose a bond action.');
  const nextId = useRef(0);
  const target = supportedCompounds.find((compound) => compound.id === targetId) ?? supportedCompounds[0]!;
  const elementOptions = useMemo(() => [...new Set(supportedCompounds.flatMap((compound) => compound.elements))], []);
  const currentCounts = countTokens(tokens);
  const targetCounts = parseFormula(target.formula);

  function addAtom(symbol: string) {
    if (tokens.length >= 8) { setFeedback('This learning builder holds up to eight atoms. Remove one to continue.'); return; }
    setTokens((current) => [...current, { id: nextId.current++, symbol }]);
    setBuilt(null);
    setFeedback(`${elementNames[symbol]} added. Arrange your atoms before forming a bond.`);
  }

  function moveAtom(index: number, offset: -1 | 1) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= tokens.length) return;
    setTokens((current) => {
      const next = [...current];
      const left = next[index];
      const right = next[nextIndex];
      if (left && right) {
        next[index] = right;
        next[nextIndex] = left;
      }
      return next;
    });
    setBuilt(null);
  }

  function formBond() {
    if (tokens.length < 2) { setFeedback('Add at least two atoms before trying to form a bond.'); return; }
    const matches = supportedCompounds.find((compound) => compound.type === (action === 'transfer' ? 'ionic' : 'covalent') && sameCounts(parseFormula(compound.formula), currentCounts) && (!guided || compound.id === target.id));
    if (!matches) {
      setBuilt(null);
      setFeedback(guided
        ? `This does not match ${target.name} yet. Hint: use ${Object.entries(targetCounts).map(([symbol, count]) => `${count} ${elementNames[symbol]}`).join(' and ')} and choose ${target.type === 'ionic' ? 'electron transfer' : 'electron sharing'}.`
        : 'This builder does not currently model this combination. Try one of the supported examples.');
      return;
    }
    setBuilt(matches);
    setFeedback(`${matches.name} formed in this supported model. ${matches.explanation}`);
  }

  return <section className="bond-builder" aria-labelledby="bond-builder-title">
    <div className="bond-builder-heading"><div><span className="bond-kicker">COMPOUND BUILDER</span><h2 id="bond-builder-title">Choose atoms. Test a bond.</h2><p>The builder checks your atom counts against supported examples. It will explain combinations it cannot model.</p></div>
      <div className="bond-builder-modes" aria-label="Builder mode"><button type="button" className={guided ? 'is-active' : ''} aria-pressed={guided} onClick={() => { setGuided(true); setBuilt(null); }}>Guided</button><button type="button" className={!guided ? 'is-active' : ''} aria-pressed={!guided} onClick={() => { setGuided(false); setBuilt(null); }}>Free exploration</button></div>
    </div>
    {guided && <label className="bond-target-select">Build a supported example<select value={targetId} onChange={(event) => { setTargetId(event.target.value); setTokens([]); setBuilt(null); setFeedback('Add atoms to match the new target.'); }}>
      {supportedCompounds.map((compound) => <option key={compound.id} value={compound.id}>{compound.name} ({compound.formula})</option>)}
    </select></label>}
    {guided && <p className="bond-builder-hint">Hint: {target.type === 'ionic' ? 'Look for electron transfer between a metal and a nonmetal.' : 'Look for electron sharing.'} Need {Object.entries(targetCounts).map(([symbol, count]) => `${count} ${symbol}`).join(' + ')}.</p>}
    <div className="bond-builder-workbench">
      <div className="bond-element-tray"><span className="bond-kicker">01 / ADD ATOMS</span><div>{elementOptions.map((symbol) => <button key={symbol} type="button" onClick={() => addAtom(symbol)} aria-label={`Add ${elementNames[symbol]} atom`}><strong>{symbol}</strong><small>{elementNames[symbol]}</small></button>)}</div></div>
      <div className="bond-arrangement"><div className="bond-arrangement-title"><span className="bond-kicker">02 / ARRANGE ATOMS</span><label><input type="checkbox" checked={showValence} onChange={(event) => setShowValence(event.target.checked)} /> Show valence electrons</label></div>
        <div className={`bond-atom-stage ${built ? 'is-bonded' : ''}`} aria-label="Selected atoms in arrangement order">{tokens.length ? tokens.map((token, index) => <div className="bond-atom-token" key={token.id}><div className="bond-atom-symbol"><strong>{built ? atomChargeLabels[built.formula]?.[token.symbol] ?? token.symbol : token.symbol}</strong>{showValence && !built && <small>{'•'.repeat(valenceElectrons[token.symbol] ?? 0)}</small>}</div><div className="bond-token-controls"><button type="button" disabled={index === 0} aria-label={`Move ${elementNames[token.symbol]} left`} onClick={() => moveAtom(index, -1)}>←</button><button type="button" disabled={index === tokens.length - 1} aria-label={`Move ${elementNames[token.symbol]} right`} onClick={() => moveAtom(index, 1)}>→</button><button type="button" aria-label={`Remove ${elementNames[token.symbol]}`} onClick={() => { setTokens((current) => current.filter((entry) => entry.id !== token.id)); setBuilt(null); }}>×</button></div></div>) : <span className="bond-stage-empty">Your atoms appear here. Add them from the element tray.</span>}</div>
        <p className="bond-stage-caption">Arrangement changes the model view. Formula matching uses the number of each atom, not their left-to-right order.</p>
      </div>
      <div className="bond-builder-actions"><span className="bond-kicker">03 / FORM A BOND</span><div className="bond-action-options"><label><input type="radio" name="bond-action" checked={action === 'share'} onChange={() => { setAction('share'); setBuilt(null); }} /> Share electrons <small>Covalent</small></label><label><input type="radio" name="bond-action" checked={action === 'transfer'} onChange={() => { setAction('transfer'); setBuilt(null); }} /> Transfer electrons <small>Ionic</small></label></div><button type="button" className="bond-primary" onClick={formBond}>Form bond →</button><button type="button" onClick={() => { setTokens([]); setBuilt(null); setFeedback('Workbench cleared. Add atoms to begin again.'); }}>Clear workbench</button></div>
    </div>
    <div className={`bond-builder-result ${built ? 'has-result' : ''}`} aria-live="polite"><span className="bond-kicker">RESULT</span>{built && <div className="bond-result-formula"><Formula formula={built.formula} /></div>}<p>{feedback}</p>{built && <><span className="bond-result-kind">{built.type === 'ionic' ? 'Ionic formula unit' : built.formula === 'H2' ? 'Elemental molecule' : 'Covalent molecule'}</span>{ionicProducts[built.formula] && <p>{ionicProducts[built.formula]}</p>}<BuiltModel compound={built} /></>}</div>
  </section>;
}

export default function BondingLab() {
  const [params, setParams] = useSearchParams();
  const visit = useProgress((state) => state.visit);
  const motion = useProgress((state) => state.motion);
  const example = examples.includes(params.get('example') as BondExample) ? params.get('example') as BondExample : params.get('mode') === 'covalent' ? 'hcl' : 'nacl';
  const mode: BondMode = bondLessons[example].mode;
  const activity: Activity = params.get('activity') === 'builder' ? 'builder' : 'guided';
  const stepValue = Number(params.get('step'));
  const step = Number.isInteger(stepValue) ? Math.min(Math.max(stepValue, 0), bondLessons[example].steps.length - 1) : 0;

  const update = useCallback((entries: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(entries).forEach(([key, value]) => next.set(key, value));
    setParams(next);
  }, [params, setParams]);
  const setStep = useCallback((value: number) => update({ step: String(value) }), [update]);
  useEffect(() => { visit('bonding'); }, [visit]);

  return <main className={`bond-page ${motion === 'reduced' ? 'is-reduced-motion' : ''}`}><div className="bond-page-inner">
    <div className="bond-breadcrumb"><Link to="/study">← Study Hub</Link><span>/</span><span>Bonding Lab</span></div>
    <header className="bond-hero"><div><span className="bond-kicker">STUDY / 03</span><h1>What holds <br /><em>atoms together?</em></h1><p>Watch an electron transfer or a pair become shared. Then build supported substances by arranging atoms yourself.</p></div><div className="bond-hero-art" aria-hidden="true"><span>Na</span><i /><span>Cl</span></div></header>
    <div className="bond-mode-switch" aria-label="Bonding type"><button type="button" className={mode === 'ionic' ? 'is-active' : ''} aria-pressed={mode === 'ionic'} onClick={() => update({ mode: 'ionic', example: 'nacl', step: '0' })}><span>01</span><strong>Ionic bonding</strong><small>An electron transfers → ions attract</small></button><button type="button" className={mode === 'covalent' ? 'is-active' : ''} aria-pressed={mode === 'covalent'} onClick={() => update({ mode: 'covalent', example: 'hcl', step: '0' })}><span>02</span><strong>Covalent bonding</strong><small>Electrons become a shared pair</small></button></div>
    <div className="bond-secondary-nav"><div role="group" aria-label="Learning activity"><button type="button" className={activity === 'guided' ? 'is-active' : ''} aria-pressed={activity === 'guided'} onClick={() => update({ activity: 'guided' })}>Guided example</button><button type="button" className={activity === 'builder' ? 'is-active' : ''} aria-pressed={activity === 'builder'} onClick={() => update({ activity: 'builder' })}>Compound builder</button></div>{activity === 'guided' && mode === 'covalent' && <div role="group" aria-label="Covalent example"><button type="button" className={example === 'hcl' ? 'is-active' : ''} aria-pressed={example === 'hcl'} onClick={() => update({ example: 'hcl', step: '0' })}>HCl / unequal sharing</button><button type="button" className={example === 'h2' ? 'is-active' : ''} aria-pressed={example === 'h2'} onClick={() => update({ example: 'h2', step: '0' })}>H₂ / equal sharing</button></div>}</div>
    {activity === 'guided' ? <GuidedLesson example={example} step={step} onStepChange={setStep} /> : <CompoundBuilder />}
    {activity === 'guided' && example === 'h2' && <div className="bond-comparison-note"><strong>Compare with HCl</strong><p>In H₂, two identical atoms pull on the shared pair equally. In HCl, chlorine pulls more strongly, making a polar bond.</p><button type="button" onClick={() => update({ example: 'hcl', step: '6' })}>Inspect HCl polarity →</button></div>}
  </div></main>;
}
