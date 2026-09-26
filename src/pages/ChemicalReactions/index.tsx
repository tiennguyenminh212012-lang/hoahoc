import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgress } from '../../app/store/progress';
import { Formula } from '../../components/chemistry/Formula';
import { reactions, type ReactionData, type SpeciesCoefficient } from '../../chemistry-data/reactions';
import { getEquationCounts, isEquationBalanced } from '../../chemistry/equationBalancer';
import { ReactionScene } from '../../scenes/reactions/ReactionScene';
import { SceneViewport } from '../../scenes/shared/SceneViewport';
import type { ReactionSelection } from '../../scenes/types';
import { balancingHints, reactionNotes } from './reactionLessonData';
import './ChemicalReactions.css';

type Activity = 'bench' | 'balance';

function Equation({ reaction, className = '' }: { reaction: ReactionData; className?: string }) {
  return <div className={`reaction-equation ${className}`} aria-label={`${reaction.name} equation`}>
    {reaction.reactants.map((entry, index) => <span className="reaction-equation-term" key={`r-${entry.formula}`}>
      {index > 0 && <span aria-hidden="true" className="reaction-equation-plus">+</span>}
      <Formula formula={entry.formula} coefficient={entry.coefficient} />
    </span>)}
    <span className="reaction-equation-arrow" aria-label="produces">→</span>
    {reaction.products.map((entry, index) => <span className="reaction-equation-term" key={`p-${entry.formula}`}>
      {index > 0 && <span aria-hidden="true" className="reaction-equation-plus">+</span>}
      <Formula formula={entry.formula} coefficient={entry.coefficient} />
    </span>)}
  </div>;
}

function ReactionFallback({ reaction, progress }: { reaction: ReactionData; progress: number }) {
  const notes = reactionNotes[reaction.id] ?? reactionNotes['water-synthesis']!;
  return <div className="reaction-fallback-diagram">
    <div className={`reaction-fallback-side ${progress < .5 ? 'is-emphasized' : ''}`}><span>REACTANTS</span><div className="reaction-equation">{reaction.reactants.map((entry, index) => <span key={entry.formula}>{index > 0 && ' + '}<Formula formula={entry.formula} coefficient={entry.coefficient} /></span>)}</div></div>
    <div className="reaction-fallback-change"><span>CHANGE ZONE / SCHEMATIC</span><strong>{notes.changeLabel}</strong><p>{notes.electronCaption}</p></div>
    <div className={`reaction-fallback-side ${progress >= .5 ? 'is-emphasized' : ''}`}><span>PRODUCTS</span><div className="reaction-equation">{reaction.products.map((entry, index) => <span key={entry.formula}>{index > 0 && ' + '}<Formula formula={entry.formula} coefficient={entry.coefficient} /></span>)}</div></div>
  </div>;
}

function selectionExplanation(selection: ReactionSelection | null, reaction: ReactionData) {
  if (!selection) return null;
  if (selection.side === 'reactants') return `${selection.formula ?? 'Reactants'} begin on the left. The atoms are conserved as the reaction proceeds.`;
  if (selection.side === 'products') return `${selection.formula ?? 'Products'} finish on the right. They contain the same element atoms, rearranged.`;
  return reactionNotes[reaction.id]?.bonds ?? reaction.explanation;
}

function ReactionBench({ reaction }: { reaction: ReactionData }) {
  const quality = useProgress((state) => state.quality);
  const motion = useProgress((state) => state.motion);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<ReactionSelection | null>(null);
  const notes = reactionNotes[reaction.id] ?? reactionNotes['water-synthesis']!;
  const counts = useMemo(() => getEquationCounts(reaction.reactants, reaction.products), [reaction]);

  useEffect(() => { setProgress(0); setPlaying(false); setSelection(null); }, [reaction.id]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setProgress((current) => {
        const next = Math.min(1, current + .025);
        if (next === 1) window.setTimeout(() => setPlaying(false), 0);
        return next;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [playing]);

  function start() { if (progress >= 1) setProgress(0); setPlaying(true); }
  function advance(offset: number) { setPlaying(false); setProgress((current) => Math.min(1, Math.max(0, Math.round(current * 4 + offset) / 4))); }

  return <div className="reaction-bench-grid">
    <div className="reaction-main-column">
      <div className="reaction-scene-wrap"><div className="reaction-scene-label"><span>REACTION BENCH / {notes.family.toUpperCase()}</span><span>{progress < .33 ? 'REACTANTS' : progress < .7 ? 'REARRANGEMENT' : 'PRODUCTS'}</span></div><SceneViewport label={`${notes.family}: ${reaction.name}`} fallback={<ReactionFallback reaction={reaction} progress={progress} />} className="reaction-scene" quality={quality} reducedMotion={motion === 'reduced'}><ReactionScene reactionId={reaction.id} reactants={reaction.reactants} products={reaction.products} progress={progress} onSelectGroup={setSelection} /></SceneViewport></div>
      <div className="reaction-change-guide" aria-live="polite"><span>CHANGE ZONE · {notes.changeLabel.toUpperCase()}</span><p>{notes.electronCaption}</p></div>
      <div className="reaction-timeline-controls"><button type="button" onClick={() => advance(-1)} disabled={progress <= 0} aria-label="Previous reaction stage">← Step</button><button type="button" className="reaction-primary" onClick={playing ? () => setPlaying(false) : start}>{playing ? 'Pause' : 'Play'}</button><button type="button" onClick={() => advance(1)} disabled={progress >= 1} aria-label="Next reaction stage">Step →</button><button type="button" onClick={() => { setPlaying(false); setProgress(0); }}>Replay</button></div>
      <label className="reaction-scrub"><span>Scrub reaction</span><input type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={(event) => { setPlaying(false); setProgress(Number(event.target.value) / 100); }} aria-label="Scrub reaction progress" /><output>{Math.round(progress * 100)}%</output></label>
      <Equation reaction={reaction} className="reaction-bench-equation" />
      <div className="reaction-count-summary"><span>ATOM CONSERVATION</span>{Object.keys(counts.reactants).sort().map((symbol) => <span key={symbol}>{symbol}: {counts.reactants[symbol]} in → {counts.products[symbol]} out</span>)}</div>
    </div>
    <aside className="reaction-inspector" aria-live="polite"><span className="reaction-kicker">FAMILY / {notes.family.toUpperCase()}</span><h2>{reaction.name}</h2><p>{reaction.explanation}</p><div><span>WHAT CHANGES</span><p>{notes.change}</p></div><div><span>BONDS & IONS</span><p>{notes.bonds}</p></div>{selection && <div className="reaction-selected"><span>SELECTED / {selection.side.toUpperCase()}</span><p>{selectionExplanation(selection, reaction)}</p></div>}<details><summary>How to read the model</summary><p>{notes.visual} Each displayed sphere and bond is a learning representation. Atoms rearrange; their nuclei do not change in an ordinary chemical reaction.</p></details><a href="https://openstax.org/books/chemistry/pages/4-2-classifying-chemical-reactions" target="_blank" rel="noreferrer">OpenStax reaction families ↗</a></aside>
  </div>;
}

function CoefficientControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="reaction-coefficient-control"><button type="button" aria-label={`Decrease coefficient for ${label}`} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button><input type="number" min="1" max="8" step="1" inputMode="numeric" aria-label={`Coefficient for ${label}`} value={value} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= 8) onChange(next); }} /><button type="button" aria-label={`Increase coefficient for ${label}`} disabled={value >= 8} onClick={() => onChange(value + 1)}>+</button></div>;
}

function MoleculeSet({ formula, coefficient, side }: { formula: string; coefficient: number; side: 'reactants' | 'products' }) {
  return <div className="reaction-molecule-set"><span>{side} / <Formula formula={formula} /></span><div className="reaction-molecule-list">{Array.from({ length: coefficient }, (_, index) => <span key={index} className="reaction-molecule" aria-label={`${formula} molecule ${index + 1}`}><span className={`reaction-molecule-glyph is-${formula.toLowerCase()}`} aria-hidden="true">{formula === 'H2O' ? <><i className="is-h" /><i className="is-o" /><i className="is-h" /></> : <><i className={formula === 'O2' ? 'is-o' : 'is-h'} /><i className={formula === 'O2' ? 'is-o' : 'is-h'} /></>}</span><Formula formula={formula} /></span>)}</div></div>;
}

function BalanceLesson() {
  const completeStep = useProgress((state) => state.completeStep);
  const [hydrogen, setHydrogen] = useState(1);
  const [oxygen, setOxygen] = useState(1);
  const [water, setWater] = useState(1);
  const [hintIndex, setHintIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const reactants: SpeciesCoefficient[] = useMemo(() => [{ formula: 'H2', coefficient: hydrogen }, { formula: 'O2', coefficient: oxygen }], [hydrogen, oxygen]);
  const products: SpeciesCoefficient[] = useMemo(() => [{ formula: 'H2O', coefficient: water }], [water]);
  const counts = useMemo(() => getEquationCounts(reactants, products), [reactants, products]);
  const balanced = useMemo(() => isEquationBalanced(reactants, products), [reactants, products]);
  const correct = balanced && hydrogen === 2 && oxygen === 1 && water === 2;

  useEffect(() => {
    if (!correct) return;
    completeStep('reactions', 6);
  }, [completeStep, correct]);

  function update(setter: (value: number) => void, value: number) { setter(value); setChecked(false); }
  function reset() { setHydrogen(1); setOxygen(1); setWater(1); setHintIndex(0); setChecked(false); }

  return <section className="reaction-balance" aria-labelledby="reaction-balance-title"><div className="reaction-balance-header"><div><span className="reaction-kicker">BALANCING WORKSHOP</span><h2 id="reaction-balance-title">Make both sides count.</h2><p>Change coefficients in front of formulas. Subscripts are part of a substance’s identity, so they stay fixed.</p></div><button type="button" onClick={reset}>Reset exercise</button></div>
    <div className="reaction-balance-grid"><div className="reaction-balance-work"><div className="reaction-edit-equation"><div><CoefficientControl label="H2" value={hydrogen} onChange={(value) => update(setHydrogen, value)} /><Formula formula="H2" /></div><span>+</span><div><CoefficientControl label="O2" value={oxygen} onChange={(value) => update(setOxygen, value)} /><Formula formula="O2" /></div><span className="reaction-equation-arrow">→</span><div><CoefficientControl label="H2O" value={water} onChange={(value) => update(setWater, value)} /><Formula formula="H2O" /></div></div>
      <div className="reaction-balance-molecules"><div><h3>Reactants</h3><MoleculeSet formula="H2" coefficient={hydrogen} side="reactants" /><MoleculeSet formula="O2" coefficient={oxygen} side="reactants" /></div><div><h3>Products</h3><MoleculeSet formula="H2O" coefficient={water} side="products" /></div></div>
      <div className="reaction-balance-buttons"><button type="button" className="reaction-primary" onClick={() => setChecked(true)}>Check balance</button><button type="button" onClick={() => setHintIndex((current) => Math.min(balancingHints.length - 1, current + 1))}>Next hint →</button><button type="button" onClick={() => setHintIndex((current) => Math.max(0, current - 1))} disabled={hintIndex === 0}>Previous hint</button></div>
      <div className={`reaction-balance-feedback ${checked && balanced ? 'is-success' : ''}`} aria-live="polite">{checked ? balanced ? <><strong>Balanced.</strong> Every element has the same count on both sides. {correct && 'You found the smallest whole-number coefficients.'}</> : <><strong>Not balanced yet.</strong> Compare the atom totals and change a coefficient.</> : <><strong>Current hint {hintIndex + 1}/{balancingHints.length}.</strong> {balancingHints[hintIndex]}</>}</div>
    </div><aside className="reaction-counter-panel"><span className="reaction-kicker">LIVE ATOM COUNTS</span><h3>Conservation check</h3><table><caption>Atoms on each side of the equation</caption><thead><tr><th scope="col">Element</th><th scope="col">In</th><th scope="col">Out</th><th scope="col">Status</th></tr></thead><tbody>{['H', 'O'].map((symbol) => <tr key={symbol} className={counts.reactants[symbol] === counts.products[symbol] ? 'is-equal' : 'is-unequal'}><th scope="row">{symbol}</th><td>{counts.reactants[symbol] ?? 0}</td><td>{counts.products[symbol] ?? 0}</td><td>{counts.reactants[symbol] === counts.products[symbol] ? 'Equal' : 'Mismatch'}</td></tr>)}</tbody></table><p>Each coefficient multiplies every atom in the formula beside it. The counts above are calculated from the formulas and your chosen coefficients.</p><div className="reaction-rule"><strong>Keep the substances the same.</strong><p>H₂O₂ is a different chemical formula; changing H₂O to H₂O₂ would not balance a water equation.</p></div></aside></div>
  </section>;
}

export default function ChemicalReactions() {
  const [params, setParams] = useSearchParams();
  const visit = useProgress((state) => state.visit);
  const reaction = reactions.find((entry) => entry.id === params.get('reaction')) ?? reactions[0]!;
  const activity: Activity = params.get('activity') === 'balance' ? 'balance' : 'bench';
  useEffect(() => { visit('reactions'); }, [visit]);
  function update(entries: Record<string, string>) { const next = new URLSearchParams(params); Object.entries(entries).forEach(([key, value]) => next.set(key, value)); setParams(next); }

  return <main className="reaction-page"><div className="reaction-page-inner"><div className="reaction-breadcrumb"><Link to="/study">← Study Hub</Link><span>/</span><span>Chemical Reactions</span></div><header className="reaction-hero"><div><span className="reaction-kicker">STUDY / 05</span><h1>Atoms remain. <br /><em>Bonds change.</em></h1><p>Observe five reaction families, then balance water formation by counting atoms on both sides.</p></div><div className="reaction-hero-glyph" aria-hidden="true"><span>H₂</span><i>+</i><span>O₂</span><i>→</i><span>H₂O</span></div></header>
    <div className="reaction-activity-nav" role="group" aria-label="Reaction activity"><button type="button" className={activity === 'bench' ? 'is-active' : ''} aria-pressed={activity === 'bench'} onClick={() => update({ activity: 'bench' })}>Reaction bench <span>Explore five families</span></button><button type="button" className={activity === 'balance' ? 'is-active' : ''} aria-pressed={activity === 'balance'} onClick={() => update({ activity: 'balance' })}>Balance an equation <span>Change coefficients and count</span></button></div>
    {activity === 'bench' ? <><div className="reaction-family-nav" aria-label="Reaction families">{reactions.map((entry, index) => <button key={entry.id} type="button" className={reaction.id === entry.id ? 'is-active' : ''} aria-pressed={reaction.id === entry.id} onClick={() => update({ reaction: entry.id })}><span>{String(index + 1).padStart(2, '0')}</span><strong>{reactionNotes[entry.id]?.family ?? entry.type}</strong></button>)}</div><ReactionBench reaction={reaction} /></> : <BalanceLesson />}
  </div></main>;
}
