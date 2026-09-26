import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Atom, Check, CircleHelp, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { getElement } from '../../chemistry-data/elements';
import { supportedCompounds } from '../../chemistry-data/compounds';
import { Formula } from '../../components/chemistry/Formula';
import type { AtomCounts } from '../../chemistry/formulaParser';
import {
  atomIsReady, formulaFromComposition, matchBench, neutralShells, shellCapacities, shellLabels,
  startingAtom, supportedReactantFormulas, type SavedAtom, type ShellCounts,
} from './freeAreaChemistry';
import './free-area.css';

type Particle = 'proton' | 'neutron' | 'electron';
type BuildMode = 'compound' | 'reactant';
type DragSource = { kind: 'particle'; particle: Particle } | { kind: 'atom'; symbol: string };
const emptyShells: ShellCounts = [0, 0, 0, 0];
const presets = [1, 6, 8, 11, 17];

function ParticleCard({ particle, title, caption, onAdd, onPointerStart, shouldIgnoreClick }: { particle: Particle; title: string; caption: string; onAdd: () => void; onPointerStart: (event: ReactPointerEvent<HTMLButtonElement>, source: DragSource) => void; shouldIgnoreClick: () => boolean }) {
  return <div className={`free-particle-card free-particle-${particle}`}>
    <button className="free-particle-drag" type="button" onPointerDown={(event) => onPointerStart(event, { kind: 'particle', particle })} onClick={() => { if (!shouldIgnoreClick()) onAdd(); }} aria-label={particle === 'electron' ? 'Drag or select electron' : `Drag or add ${particle}`}>
      <span aria-hidden="true">{particle === 'proton' ? 'p⁺' : particle === 'neutron' ? 'n' : 'e⁻'}</span>
    </button>
    <div><strong>{title}</strong><small>{caption}</small></div>
    <button className="free-mini-add" type="button" onClick={onAdd} aria-label={particle === 'electron' ? 'Select electron' : `Add ${particle}`}>+</button>
  </div>;
}

export default function FreeArea() {
  const [searchParams] = useSearchParams();
  const requestedElement = Number(searchParams.get('element'));
  const initial = Number.isInteger(requestedElement) && requestedElement >= 1 && requestedElement <= 118
    ? startingAtom(requestedElement) ?? { protons: requestedElement, neutrons: 0, shells: emptyShells }
    : null;
  const [protons, setProtons] = useState(initial?.protons ?? 0);
  const [neutrons, setNeutrons] = useState(initial?.neutrons ?? 0);
  const [shells, setShells] = useState<ShellCounts>(initial?.shells ?? emptyShells);
  const [savedAtoms, setSavedAtoms] = useState<SavedAtom[]>([]);
  const [composition, setComposition] = useState<AtomCounts>({});
  const [mode, setMode] = useState<BuildMode>('compound');
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState('');
  const dragPreview = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<HTMLElement | null>(null);
  const suppressClick = useRef(false);
  const element = getElement(protons);
  const electrons = shells.reduce((total, count) => total + count, 0);
  const expectedShells = neutralShells(protons);
  const ready = atomIsReady(protons, shells);
  const isEmptyTray = Object.values(composition).every((count) => count === 0);
  const result = useMemo(() => matchBench(composition, mode), [composition, mode]);
  const possibleFormulas = mode === 'compound' ? supportedCompounds.map(({ formula }) => formula) : supportedReactantFormulas();

  const addNucleon = (particle: 'proton' | 'neutron') => {
    if (particle === 'proton') setProtons((count) => Math.min(118, count + 1));
    else setNeutrons((count) => Math.min(180, count + 1));
    setNotice('');
  };

  const addElectron = (index: number) => {
    if (!expectedShells) {
      setNotice('Build a nucleus with 1–20 protons to use this simple shell model.');
      return;
    }
    setShells((current) => {
      if ((current[index] ?? 0) >= (shellCapacities[index] ?? 0)) return current;
      const next: ShellCounts = [...current];
      next[index] = (next[index] ?? 0) + 1;
      return next;
    });
    setNotice('');
  };

  const removeElectron = (index: number) => {
    setShells((current) => {
      if (current[index] === 0) return current;
      const next: ShellCounts = [...current];
      next[index] = (next[index] ?? 0) - 1;
      return next;
    });
    setNotice('');
  };

  const loadPreset = (number: number) => {
    const preset = startingAtom(number);
    if (!preset) return;
    setProtons(preset.protons);
    setNeutrons(preset.neutrons);
    setShells(preset.shells);
    setNotice(`${getElement(number)?.name} preset loaded. You can still change every particle.`);
  };

  const saveAtom = () => {
    if (!element || !ready) return;
    const atom = { symbol: element.symbol, atomicNumber: protons, massNumber: protons + neutrons };
    setSavedAtoms((current) => current.some((saved) => saved.symbol === atom.symbol && saved.massNumber === atom.massNumber) ? current : [...current, atom]);
    setNotice(`${element.name}-${atom.massNumber} added to your atom shelf. Place it in the formula tray below.`);
  };

  const addToTray = (symbol: string) => {
    if (!savedAtoms.some((atom) => atom.symbol === symbol)) return;
    setComposition((current) => {
      const total = Object.values(current).reduce((sum, count) => sum + count, 0);
      if (total >= 20) return current;
      return { ...current, [symbol]: (current[symbol] ?? 0) + 1 };
    });
    setChecked(false);
  };

  const removeFromTray = (symbol: string) => {
    setComposition((current) => {
      if (!current[symbol]) return current;
      const next = { ...current, [symbol]: current[symbol] - 1 };
      if (next[symbol] === 0) delete next[symbol];
      return next;
    });
    setChecked(false);
  };

  const changeMode = (next: BuildMode) => { setMode(next); setChecked(false); };

  const startPointerDrag = (event: ReactPointerEvent<HTMLButtonElement>, source: DragSource) => {
    if (event.button !== 0) return;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    event.currentTarget.setPointerCapture?.(pointerId);

    const matchingTarget = (x: number, y: number): HTMLElement | null => {
      const element = document.elementFromPoint(x, y);
      if (source.kind === 'atom') return element?.closest('.free-formula-zone') as HTMLElement | null;
      return element?.closest(source.particle === 'electron' ? '.free-orbit' : '.free-nucleus') as HTMLElement | null;
    };
    const clearVisual = () => {
      if (dragPreview.current) dragPreview.current.style.display = 'none';
      dragTarget.current?.classList.remove('is-pointer-target');
      dragTarget.current = null;
    };
    const removeListeners = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      if (!moved && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) < 8) return;
      moved = true;
      if (dragPreview.current) {
        dragPreview.current.style.display = 'grid';
        dragPreview.current.style.left = `${pointer.clientX}px`;
        dragPreview.current.style.top = `${pointer.clientY}px`;
        dragPreview.current.textContent = source.kind === 'atom' ? source.symbol : source.particle === 'proton' ? 'p⁺' : source.particle === 'neutron' ? 'n' : 'e⁻';
        dragPreview.current.dataset.kind = source.kind === 'atom' ? 'atom' : source.particle;
      }
      const nextTarget = matchingTarget(pointer.clientX, pointer.clientY);
      if (nextTarget !== dragTarget.current) {
        dragTarget.current?.classList.remove('is-pointer-target');
        nextTarget?.classList.add('is-pointer-target');
        dragTarget.current = nextTarget;
      }
    };
    const finish = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      const target = moved ? matchingTarget(pointer.clientX, pointer.clientY) : null;
      removeListeners();
      clearVisual();
      if (!moved) return;
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      if (!target) return;
      if (source.kind === 'atom') addToTray(source.symbol);
      else if (source.particle === 'electron') addElectron(Number(target.dataset.shellIndex));
      else addNucleon(source.particle);
    };
    const cancel = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      removeListeners();
      clearVisual();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };

  return <main className="free-area-page container">
    <div className="free-area-top"><Link className="page-back" to="/study/atoms"><ArrowLeft size={15} /> Atom Explorer</Link><span className="free-area-top-tag">INTERACTIVE WORKBENCH / 01</span></div>
    <div className="free-area-hero">
      <div><p className="eyebrow">Free Area · Build and discover</p><h1 className="display">A little universe{' '}<br /><em>you can build.</em></h1><p>Make a nucleus, arrange its electrons, then bring your atoms together. Drag particles or use the buttons—both paths work.</p></div>
      <div className="free-area-hero-mark" aria-hidden="true"><Atom size={60} strokeWidth={1} /><span>YOUR LAB</span></div>
    </div>

    <div className="free-area-grid">
      <section className="free-area-palette surface" aria-labelledby="particles-heading">
        <div className="free-section-number">01 / PARTICLE SHELF</div>
        <h2 id="particles-heading">Pick a particle</h2>
        <p>Drag <strong>p⁺</strong> and <strong>n</strong> into the nucleus. Drag <strong>e⁻</strong> onto a shell ring. On touch screens, use the + buttons.</p>
        <div className="free-particles">
          <ParticleCard particle="proton" title="Proton" caption="Positive · sets the element" onAdd={() => addNucleon('proton')} onPointerStart={startPointerDrag} shouldIgnoreClick={() => suppressClick.current} />
          <ParticleCard particle="neutron" title="Neutron" caption="Neutral · changes the isotope" onAdd={() => addNucleon('neutron')} onPointerStart={startPointerDrag} shouldIgnoreClick={() => suppressClick.current} />
          <ParticleCard particle="electron" title="Electron" caption="Negative · choose a shell below" onAdd={() => setNotice('Choose a shell with its + button, or drag this electron onto a ring.')} onPointerStart={startPointerDrag} shouldIgnoreClick={() => suppressClick.current} />
        </div>
        <div className="free-preset-box">
          <span className="free-preset-title"><Sparkles size={15} /> Quick starting atoms</span>
          <div className="free-presets">{presets.map((number) => <button key={number} type="button" onClick={() => loadPreset(number)} aria-label={`Load ${getElement(number)?.name} preset`}>{getElement(number)?.symbol}</button>)}</div>
          <small>Presets are shortcuts, not fixed answers. Edit every particle afterward.</small>
        </div>
      </section>

      <section className="free-area-stage surface" aria-labelledby="stage-heading">
        <div className="free-stage-head"><div><div className="free-section-number">02 / ATOM CANVAS</div><h2 id="stage-heading">Build your atom</h2></div><button type="button" className="free-clear" onClick={() => { setProtons(0); setNeutrons(0); setShells([0, 0, 0, 0]); setNotice('Canvas cleared. Your saved atom shelf is still here.'); }}><RotateCcw size={15} /> Clear canvas</button></div>
        <div className="free-atom-visual">
          <div className="free-atom-grid" aria-hidden="true" />
          <div className="free-orbit-space">
            {[3, 2, 1, 0].map((index) => <div key={index} className={`free-orbit free-orbit-${index}`} role="group" aria-label={`${shellLabels[index]} shell drop zone`} data-shell-index={index} style={{ zIndex: 4 - index }}>
              {Array.from({ length: shells[index] ?? 0 }, (_, electronIndex) => {
                const angle = (electronIndex / (shells[index] ?? 1)) * Math.PI * 2 - Math.PI / 2;
                return <span key={electronIndex} className="free-electron-dot" style={{ left: `${50 + Math.cos(angle) * 50}%`, top: `${50 + Math.sin(angle) * 50}%` } as CSSProperties} aria-hidden="true" />;
              })}
            </div>)}
            <div className="free-nucleus" role="group" aria-label="Nucleus drop zone">
              {protons + neutrons === 0 ? <span className="free-nucleus-empty">DROP<br />HERE</span> : <div className="free-nucleons" aria-hidden="true">{Array.from({ length: Math.min(protons, 14) }, (_, index) => <span key={`p${index}`} className="free-nucleon free-nucleon-proton" />)}{Array.from({ length: Math.min(neutrons, 14) }, (_, index) => <span key={`n${index}`} className="free-nucleon free-nucleon-neutron" />)}</div>}
            </div>
          </div>
          <span className="free-visual-label free-visual-label-nucleus">NUCLEUS</span><span className="free-visual-label free-visual-label-shell">ELECTRON SHELLS</span>
        </div>
        <div className="free-shell-controls" aria-label="Electron shell controls">{shellLabels.map((label, index) => <div className="free-shell-control" key={label}><div className="free-shell-control-name"><span>{label}</span><small>shell</small></div><strong>{shells[index]} <small>/ {shellCapacities[index]}</small></strong><div className="free-stepper"><button type="button" onClick={() => removeElectron(index)} disabled={shells[index] === 0} aria-label={`Remove electron from ${label} shell`}>−</button><button type="button" onClick={() => addElectron(index)} disabled={!expectedShells || (shells[index] ?? 0) >= (shellCapacities[index] ?? 0)} aria-label={`Add electron to ${label} shell`}>+</button></div></div>)}</div>
        <div className="free-stage-actions"><button className="button button-primary" type="button" onClick={() => { if (expectedShells) { setShells(expectedShells); setNotice(`Filled ${element?.name}'s simple shells: ${expectedShells.filter(Boolean).join(' · ')}.`); } }} disabled={!expectedShells}><Sparkles size={16} /> Auto-fill neutral shells</button><span>First 20 elements · simplified main-shell model</span></div>
      </section>

      <aside className="free-area-identity surface" aria-labelledby="identity-heading">
        <div className="free-section-number">03 / WHAT DID YOU MAKE?</div>
        <h2 id="identity-heading">Element identity</h2>
        <div className={`free-element-tile ${element ? 'is-element' : ''}`}><span className="free-element-number">{protons || '—'}</span><strong>{element?.symbol ?? '?'}</strong><span>{element?.name ?? 'Start with a proton'}</span></div>
        <p className="free-identity-name" data-testid="element-identity">{element ? `${element.name}-${protons + neutrons}` : 'Your element appears here'}</p>
        <p className="free-identity-detail">{element ? `Proton count ${protons} identifies this element. With ${neutrons} ${neutrons === 1 ? 'neutron' : 'neutrons'}, its mass number is ${protons + neutrons}.` : 'Put a proton in the nucleus to identify an element.'}</p>
        <div className="free-counts"><div><span>PROTONS</span><strong>{protons}</strong><button type="button" onClick={() => setProtons((count) => Math.max(0, count - 1))} disabled={protons === 0} aria-label="Remove proton">−</button></div><div><span>NEUTRONS</span><strong>{neutrons}</strong><button type="button" onClick={() => setNeutrons((count) => Math.max(0, count - 1))} disabled={neutrons === 0} aria-label="Remove neutron">−</button></div><div><span>ELECTRONS</span><strong>{electrons}</strong><span>e⁻</span></div></div>
        <div className={`free-status ${ready ? 'is-ready' : ''}`} role="status">{ready ? <><Check size={16} /> Neutral atom · shell arrangement {shells.filter(Boolean).join('–')}</> : !element ? <>Add a proton to begin.</> : !expectedShells ? <>The shell guide covers the first 20 elements. {element.name} is identified from its nucleus; try a lighter atom for shells.</> : electrons !== protons ? <>This has {electrons < protons ? `${protons - electrons} fewer` : `${electrons - protons} extra`} electron{Math.abs(protons - electrons) === 1 ? '' : 's'} than a neutral atom.</> : <>A neutral {element.name} atom needs the shell order {expectedShells.filter(Boolean).join('–')}. Adjust your rings or use auto-fill.</>}</div>
        <button type="button" className="button free-save-atom" onClick={saveAtom} disabled={!ready}><Atom size={17} /> Save atom to shelf <ArrowRight size={16} /></button>
        <p className="free-science-note"><CircleHelp size={14} /> Mass number is protons + neutrons; it is not the periodic table’s average atomic weight. Nuclear stability is not checked.</p>
      </aside>
    </div>

    {notice ? <p className="free-notice" role="status">{notice}</p> : null}

    <section className="free-area-bench surface" aria-labelledby="bench-heading">
      <div className="free-bench-intro"><div><div className="free-section-number">04 / ASSEMBLY BENCH</div><h2 id="bench-heading">Bring atoms together.</h2><p>Save an atom above, then drag it into the tray—or tap its add button. The checker uses the verified examples in these lessons.</p></div><div className="free-bench-mode" role="group" aria-label="Build mode"><button type="button" onClick={() => changeMode('compound')} aria-pressed={mode === 'compound'}>Compound / molecule</button><button type="button" onClick={() => changeMode('reactant')} aria-pressed={mode === 'reactant'}>Reaction reactant</button></div></div>
      <div className="free-bench-grid">
        <div className="free-atom-shelf"><h3>YOUR ATOM SHELF <span>{savedAtoms.length}</span></h3>{savedAtoms.length === 0 ? <p className="free-empty-shelf">No saved atoms yet. Build a neutral atom and save it to begin.</p> : <div className="free-saved-list">{savedAtoms.map((atom) => <div className="free-saved-atom" key={`${atom.symbol}-${atom.massNumber}`}><button type="button" onPointerDown={(event) => startPointerDrag(event, { kind: 'atom', symbol: atom.symbol })} onClick={() => { if (!suppressClick.current) addToTray(atom.symbol); }} aria-label={`Add ${getElement(atom.atomicNumber)?.name} atom to tray`}><strong>{atom.symbol}</strong><span>{getElement(atom.atomicNumber)?.name}-{atom.massNumber}</span><span aria-hidden="true">＋</span></button><button className="free-remove-saved" type="button" onClick={() => setSavedAtoms((current) => current.filter((item) => item !== atom))} aria-label={`Remove ${getElement(atom.atomicNumber)?.name}-${atom.massNumber} from shelf`}><Trash2 size={15} /></button></div>)}</div>}</div>
        <div className="free-formula-zone" role="group" aria-label="Formula tray drop zone"><div className="free-zone-head"><h3>{mode === 'compound' ? 'COMPOUND / MOLECULE TRAY' : 'REACTANT TRAY'}</h3><button type="button" onClick={() => { setComposition({}); setChecked(false); }} disabled={isEmptyTray}>Clear tray</button></div><p className="free-zone-hint">{mode === 'compound' ? 'Combine saved atoms into a supported bonded substance.' : 'Assemble one species that appears on the reactant side of a lesson reaction.'}</p><div className="free-formula-readout" aria-label="Atoms in tray">{isEmptyTray ? <span className="free-drop-prompt">DROP ATOMS HERE<br /><small>or tap one from your shelf</small></span> : <><span className="free-inventory-label">ATOMS IN TRAY</span><strong>{formulaFromComposition(composition)}</strong></>}</div>{!isEmptyTray ? <div className="free-tray-atoms">{Object.entries(composition).map(([symbol, count]) => <div key={symbol}><span>{symbol} × {count}</span><button type="button" onClick={() => removeFromTray(symbol)} aria-label={`Remove one ${getElement(symbol)?.name} atom from tray`}>−</button></div>)}</div> : null}<button className="button button-primary free-check" type="button" disabled={isEmptyTray} onClick={() => setChecked(true)}>Check combination <ArrowRight size={16} /></button></div>
        <div className="free-bench-result" aria-live="polite"><h3>THE RESULT</h3>{!checked ? <div className="free-result-idle"><span>?</span><p>Add atoms to the tray and check what they can make.</p></div> : result?.kind === 'compound' ? <div className="free-result-success"><span className="free-result-check"><Check size={20} /></span><small>VERIFIED {result.compound.type.toUpperCase()} EXAMPLE</small><h4>{result.compound.name}</h4><div className="free-result-formula"><Formula formula={result.compound.formula} /></div><p>{result.compound.explanation}</p><Link to="/study/bonding">Explore bonding <ArrowRight size={14} /></Link></div> : result?.kind === 'reactant' ? <div className="free-result-success"><span className="free-result-check"><Check size={20} /></span><small>VERIFIED REACTANT</small><h4><Formula formula={result.formula} /></h4><p>This species appears on the reactant side of {result.reactions.map((reaction) => reaction.name).join(' and ')}. The reaction lesson shows how its atoms rearrange.</p><Link to={`/study/reactions?reaction=${result.reactions[0]?.id ?? ''}`}>See the reaction <ArrowRight size={14} /></Link></div> : <div className="free-result-unsupported"><span>↗</span><h4>Not in this teaching set yet.</h4><p>These atoms are a valid inventory, but this workbench does not claim a bond or reaction for that combination. Try one of the verified targets below.</p></div>}</div>
      </div>
      <div className="free-targets"><span>VERIFIED {mode === 'compound' ? 'SUBSTANCES' : 'REACTANTS'} TO TRY</span><div>{possibleFormulas.map((formula) => <span key={formula}><Formula formula={formula} /></span>)}</div></div>
    </section>
    <p className="free-area-footer">This is a model for learning. Shells are simplified for the first 20 elements; a completed tray is checked by composition, then identified only when it matches a verified example.</p>
    <div ref={dragPreview} className="free-drag-preview" aria-hidden="true" />
  </main>;
}
