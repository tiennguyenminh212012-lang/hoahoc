import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgress } from '../../app/store/progress';
import { ions, type IonData } from '../../chemistry-data/ions';
import { Formula } from '../../components/chemistry/Formula';
import './PolyatomicIons.css';

type Mode = 'learn' | 'compare' | 'practice' | 'guide';
type HiddenField = 'name' | 'formula' | 'charge';

const modes: { id: Mode; label: string; description: string }[] = [
  { id: 'learn', label: 'Learn', description: 'Names, formulas, and patterns' },
  { id: 'compare', label: 'Compare', description: 'Spot small changes' },
  { id: 'practice', label: 'Memory practice', description: 'Recall before revealing' },
  { id: 'guide', label: 'Naming guide', description: 'Rules and exceptions' },
];

const comparisons = [
  { id: 'nitrate-nitrite', left: 'nitrate', right: 'nitrite', change: 'Nitrate has three oxygen atoms; nitrite has two. Their charges are both −1.' },
  { id: 'sulfate-sulfite', left: 'sulfate', right: 'sulfite', change: 'Sulfate has four oxygen atoms; sulfite has three. Their charges are both −2.' },
];

function chargeLabel(charge: number) {
  return `${charge > 0 ? '+' : '−'}${Math.abs(charge)}`;
}

function IonCard({ ion, selected, onSelect }: { ion: IonData; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`ion-card ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <span className="ion-card-top"><span>{ion.family ?? 'Polyatomic ion'}</span><span>{chargeLabel(ion.charge)}</span></span>
      <strong><Formula formula={ion.formula} charge={ion.charge} /></strong>
      <span className="ion-card-name">{ion.name}</span>
    </button>
  );
}

function IonLearn({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const selected = ions.find((ion) => ion.id === selectedId) ?? ions[0]!;
  return (
    <div className="ion-learn-layout">
      <div className="ion-grid" aria-label="Polyatomic ions">
        {ions.map((ion) => <IonCard key={ion.id} ion={ion} selected={ion.id === selected.id} onSelect={() => onSelect(ion.id)} />)}
      </div>
      <aside className="ion-detail" aria-live="polite">
        <div className="ion-detail-eyebrow">ION INSPECTOR / {String(ions.indexOf(selected) + 1).padStart(2, '0')}</div>
        <div className="ion-detail-formula"><Formula formula={selected.formula} charge={selected.charge} /></div>
        <h2>{selected.name}</h2>
        <dl>
          <div><dt>Charge</dt><dd>{chargeLabel(selected.charge)}</dd></div>
          <div><dt>Family</dt><dd>{selected.family ?? 'Common ion'}</dd></div>
        </dl>
        <p>{selected.note ?? 'Learn this ion as a whole group of atoms with an overall charge.'}</p>
        {selected.id === 'acetate' && <p>Acetate is also written <Formula formula="CH3COO" charge={-1} />. Both forms describe the same ion.</p>}
        <a href="https://openstax.org/books/chemistry/pages/2-7-chemical-nomenclature" target="_blank" rel="noreferrer">Read the OpenStax naming reference ↗</a>
      </aside>
    </div>
  );
}

function OxygenCount({ formula }: { formula: string }) {
  const match = formula.match(/O(\d*)/);
  const count = match ? Number(match[1] || 1) : 0;
  return <span className="oxygen-count">{count} oxygen {count === 1 ? 'atom' : 'atoms'}</span>;
}

function IonCompare() {
  const [pairId, setPairId] = useState(comparisons[0]!.id);
  const pair = comparisons.find((entry) => entry.id === pairId) ?? comparisons[0]!;
  const left = ions.find((ion) => ion.id === pair.left);
  const right = ions.find((ion) => ion.id === pair.right);
  if (!left || !right) return <p>Comparison data is unavailable.</p>;

  return (
    <section className="ion-mode-panel" aria-labelledby="ion-compare-title">
      <div className="ion-panel-heading"><div><span className="ion-kicker">PATTERN STUDIO</span><h2 id="ion-compare-title">One oxygen changes the name.</h2></div>
        <label className="ion-select-label">Compare pair
          <select value={pairId} onChange={(event) => setPairId(event.target.value)}>{comparisons.map((entry) => <option key={entry.id} value={entry.id}>{entry.left} / {entry.right}</option>)}</select>
        </label>
      </div>
      <div className="ion-comparison">
        {[left, right].map((ion) => <article key={ion.id} className="ion-compare-card">
          <span className="ion-kicker">{ion.name.endsWith('ate') ? 'MORE OXYGEN' : 'LESS OXYGEN'}</span>
          <div className="ion-compare-formula"><Formula formula={ion.formula} charge={ion.charge} /></div>
          <h3>{ion.name}</h3>
          <OxygenCount formula={ion.formula} />
          <span className="ion-compare-charge">Charge {chargeLabel(ion.charge)}</span>
        </article>)}
      </div>
      <p className="ion-change"><strong>What changed?</strong> {pair.change} This pattern applies to these related pairs; ion names still need careful learning.</p>
    </section>
  );
}

function IonPractice() {
  const savedPractice = useProgress((state) => state.ionPractice);
  const practiceIon = useProgress((state) => state.practiceIon);
  const stats = Object.values(savedPractice).reduce((totals, value) => ({ correct: totals.correct + value.correct, review: totals.review + value.review }), { correct: 0, review: 0 });
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState<HiddenField>('formula');
  const [revealed, setRevealed] = useState(false);
  const ion = ions[index % ions.length]!;

  function next() {
    setIndex((current) => (current + 1) % ions.length);
    setRevealed(false);
  }

  function mark(kind: 'correct' | 'review') {
    if (!revealed) return;
    practiceIon(ion.id, kind === 'correct');
    next();
  }

  return (
    <section className="ion-practice ion-mode-panel" aria-labelledby="ion-practice-title">
      <div className="ion-panel-heading"><div><span className="ion-kicker">RECALL LAB</span><h2 id="ion-practice-title">Bring it to mind first.</h2></div><div className="ion-practice-score" aria-label="Practice progress"><strong>{stats.correct}</strong> remembered <span aria-hidden="true">/</span> <strong>{stats.review}</strong> to revisit</div></div>
      <fieldset className="ion-hide-options"><legend>Hide what you want to practise</legend>
        {(['name', 'formula', 'charge'] as const).map((field) => <label key={field}><input type="radio" name="hidden-field" value={field} checked={hidden === field} onChange={() => { setHidden(field); setRevealed(false); }} />{{ name: 'Name', formula: 'Formula', charge: 'Charge' }[field]}</label>)}
      </fieldset>
      <div className="ion-recall-card" aria-live="polite">
        <span className="ion-kicker">ION {index + 1} OF {ions.length}</span>
        <div className={`ion-recall-main ${hidden === 'formula' && !revealed ? 'is-hidden' : ''}`}>
          {hidden === 'formula' && !revealed ? <span>Formula hidden</span> : <Formula formula={ion.formula} charge={hidden === 'charge' && !revealed ? undefined : ion.charge} />}
        </div>
        <div className="ion-recall-fields">
          <div><span>Name</span><strong>{hidden === 'name' && !revealed ? 'Hidden' : ion.name}</strong></div>
          <div><span>Charge</span><strong>{hidden === 'charge' && !revealed ? 'Hidden' : chargeLabel(ion.charge)}</strong></div>
        </div>
        {revealed && <p className="ion-recall-note">{ion.note ?? 'Notice the atoms and overall charge together.'}</p>}
      </div>
      <div className="ion-practice-actions">
        {!revealed ? <button type="button" className="ion-primary" onClick={() => setRevealed(true)}>Reveal answer</button> : <>
          <button type="button" className="ion-primary" onClick={() => mark('correct')}>I remembered</button>
          <button type="button" onClick={() => mark('review')}>Review again</button>
        </>}
        <button type="button" onClick={next}>Next ion <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

function NamingGuide() {
  return <section className="ion-mode-panel ion-guide" aria-labelledby="ion-guide-title">
    <span className="ion-kicker">NAMING FIELD GUIDE</span><h2 id="ion-guide-title">Patterns help. Exceptions matter.</h2>
    <div className="ion-guide-grid">
      <article><span>01 / OXYGEN FAMILY</span><h3>-ate and -ite</h3><p>For related oxygen-containing ions, <strong>-ate</strong> commonly has more oxygen than <strong>-ite</strong>. Compare nitrate, <Formula formula="NO3" charge={-1} />, with nitrite, <Formula formula="NO2" charge={-1} />.</p></article>
      <article><span>02 / EXTENSIONS</span><h3>hypo- and per-</h3><p>Some oxygen-ion families extend the pattern: <strong>hypo-</strong> indicates fewer oxygen atoms, and <strong>per-</strong> indicates more. Learn each family's actual formulas and charges.</p></article>
      <article><span>03 / COMMON ENDING</span><h3>-ide</h3><p>The ending <strong>-ide</strong> is common for single-atom negative ions. There are multi-atom exceptions to remember, including hydroxide <Formula formula="OH" charge={-1} /> and cyanide <Formula formula="CN" charge={-1} />.</p></article>
      <article><span>04 / DIFFERENT JOB</span><h3>mono-, di-, tri-, tetra-</h3><p>These number prefixes are used in naming molecular compounds. They do not tell you a polyatomic ion's charge: mono = 1, di = 2, tri = 3, tetra = 4.</p></article>
    </div>
    <p className="ion-guide-footnote">Memorize common ion names, formulas, and charges as complete units. Naming patterns support memory; they do not replace the ion list.</p>
  </section>;
}

export default function PolyatomicIons() {
  const [params, setParams] = useSearchParams();
  const visit = useProgress((state) => state.visit);
  const motion = useProgress((state) => state.motion);
  const mode = modes.some((entry) => entry.id === params.get('mode')) ? params.get('mode') as Mode : 'learn';
  const selectedId = useMemo(() => ions.some((ion) => ion.id === params.get('ion')) ? params.get('ion')! : ions[0]?.id ?? '', [params]);
  useEffect(() => { visit('polyatomic-ions'); }, [visit]);

  function updateParams(next: Record<string, string>) {
    const updated = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => updated.set(key, value));
    setParams(updated);
  }

  return <main className={`ion-page ${motion === 'reduced' ? 'is-reduced-motion' : ''}`}>
    <div className="ion-page-inner">
      <div className="ion-breadcrumb"><Link to="/study">← Study Hub</Link><span>/</span><span>Polyatomic Ions</span></div>
      <header className="ion-hero"><div><span className="ion-kicker">STUDY / 04</span><h1>Many atoms. <br /><em>One charge.</em></h1><p>Polyatomic ions are groups of bonded atoms that carry a net electrical charge. Learn their formulas, see naming patterns, then test your recall.</p></div><div className="ion-hero-mark" aria-hidden="true"><span>NO<sub>3</sub><sup>−</sup></span><span>SO<sub>4</sub><sup>2−</sup></span><span>NH<sub>4</sub><sup>+</sup></span></div></header>
      <nav className="ion-mode-nav" aria-label="Polyatomic ion learning modes">{modes.map((entry) => <button key={entry.id} type="button" className={mode === entry.id ? 'is-active' : ''} aria-current={mode === entry.id ? 'page' : undefined} onClick={() => updateParams({ mode: entry.id })}><strong>{entry.label}</strong><span>{entry.description}</span></button>)}</nav>
      {mode === 'learn' && <IonLearn selectedId={selectedId} onSelect={(id) => updateParams({ ion: id })} />}
      {mode === 'compare' && <IonCompare />}
      {mode === 'practice' && <IonPractice />}
      {mode === 'guide' && <NamingGuide />}
    </div>
  </main>;
}
