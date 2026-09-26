import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgress } from '../../app/store/progress';
import { elementCategoryLabels, groupDescriptions } from '../../chemistry-data/categories';
import { elements, getElement, type ElementCategory, type ElementData } from '../../chemistry-data/elements';
import { getIsotopeForElement } from '../../chemistry-data/isotopes';
import './PeriodicTable.css';

const categories = Object.keys(elementCategoryLabels) as ElementCategory[];
function requireElement(number: number): ElementData {
  const element = getElement(number);
  if (!element) throw new Error(`Element ${number} is missing from the dataset.`);
  return element;
}
const defaultElement = requireElement(11);

function groupLabel(group: number | undefined): string {
  return group === undefined ? 'F-block series' : `Group ${group}`;
}

function atomRoute(element: ElementData): string {
  const isotope = getIsotopeForElement(element.atomicNumber);
  const params = new URLSearchParams({ element: String(element.atomicNumber) });
  if (isotope) params.set('isotope', String(isotope.massNumber));
  return `/study/atoms?${params.toString()}`;
}

function ElementInspector({ element, matching }: { element: ElementData; matching: boolean }) {
  return (
    <div className="pt-inspector-content">
      <div className="pt-inspector-topline">
        <span>ELEMENT DOSSIER</span>
        <span>{String(element.atomicNumber).padStart(3, '0')} / 118</span>
      </div>
      <div className={`pt-inspector-heading pt-cat-${element.category}`}>
        <span className="pt-inspector-symbol" aria-hidden="true">{element.symbol}</span>
        <div>
          <p>{groupLabel(element.group)} · Period {element.period}</p>
          <h2>{element.name}</h2>
          <span>{elementCategoryLabels[element.category]}</span>
        </div>
      </div>
      {!matching && <p className="pt-filter-notice">This element is outside the current filter. Clear filters or select a highlighted tile to explore another.</p>}
      <dl className="pt-facts">
        <div><dt>Atomic number</dt><dd>{element.atomicNumber}</dd></div>
        <div><dt>Atomic mass</dt><dd>{element.atomicMass}</dd></div>
        <div><dt>Group</dt><dd>{element.group ?? 'F-block'}</dd></div>
        <div><dt>Period</dt><dd>{element.period}</dd></div>
        <div><dt>Category</dt><dd>{elementCategoryLabels[element.category]}</dd></div>
        <div><dt>State at room temperature</dt><dd>{element.stateAtRoomTemperature ?? 'Not established here'}</dd></div>
      </dl>
      <div className="pt-inspector-notes">
        <h3>Electron arrangement</h3>
        {element.electronConfiguration ? (
          <>
            <p className="pt-configuration">{element.electronConfiguration}</p>
            <p>Shell arrangement: {element.shellArrangement?.join(', ')}</p>
          </>
        ) : (
          <p>A detailed electron configuration is not included for this element in this exhibit. The three guided atom models have verified arrangements.</p>
        )}
        {element.facts && <ul>{element.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
      </div>
      <div className="pt-inspector-actions">
        <Link className="button button-primary" to={atomRoute(element)}>Open Atom <span aria-hidden="true">↗</span></Link>
        <a href="https://www.ciaaw.org/abridged-atomic-weights.htm" target="_blank" rel="noreferrer">Atomic weight source ↗</a>
      </div>
      <p className="pt-mass-note">A number in brackets, such as [294], is a nuclide mass number because no standard atomic weight is available.</p>
    </div>
  );
}

export default function PeriodicTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visit = useProgress((state) => state.visit);
  const rememberElement = useProgress((state) => state.selectElement);
  const lastElement = useProgress((state) => state.lastElement);

  const requestedElement = Number(searchParams.get('element'));
  const selected = getElement(requestedElement) ?? getElement(lastElement) ?? defaultElement;
  const search = searchParams.get('q') ?? '';
  const rawGroup = Number(searchParams.get('group'));
  const group = Number.isInteger(rawGroup) && rawGroup >= 1 && rawGroup <= 18 ? rawGroup : undefined;
  const rawCategory = searchParams.get('category');
  const category = categories.includes(rawCategory as ElementCategory) ? rawCategory as ElementCategory : undefined;

  const filteredElements = useMemo(() => {
    const term = search.trim().toLowerCase();
    return elements.filter((element) =>
      (!term || element.name.toLowerCase().includes(term) || element.symbol.toLowerCase().includes(term) || String(element.atomicNumber) === term)
      && (group === undefined || element.group === group)
      && (category === undefined || element.category === category),
    );
  }, [search, group, category]);
  const matches = useMemo(() => new Set(filteredElements.map((element) => element.atomicNumber)), [filteredElements]);

  useEffect(() => { visit('periodic-table'); }, [visit]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileInspectorOpen && !dialog.open) dialog.showModal();
    if (!mobileInspectorOpen && dialog.open) dialog.close();
  }, [mobileInspectorOpen]);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const closeOnWiderScreen = () => { if (!mobile.matches) setMobileInspectorOpen(false); };
    mobile.addEventListener('change', closeOnWiderScreen);
    return () => mobile.removeEventListener('change', closeOnWiderScreen);
  }, []);

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function chooseElement(element: ElementData) {
    rememberElement(element.atomicNumber);
    updateParam('element', String(element.atomicNumber));
    if (window.matchMedia('(max-width: 767px)').matches) setMobileInspectorOpen(true);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    next.set('element', String(selected.atomicNumber));
    setSearchParams(next, { replace: true });
  }

  const filterDescription = group !== undefined
    ? groupDescriptions[group] ?? `Group ${group} is highlighted. Select an element to compare its details.`
    : category ? `${elementCategoryLabels[category]} are highlighted. Select an element to inspect it.`
      : 'Each column is a group; each horizontal row is a period. The two separated rows continue periods 6 and 7.';

  return (
    <main className="pt-page container">
      <span className="sr-only" aria-live="polite">Selected {selected.name}, atomic number {selected.atomicNumber}.</span>
      <div className="pt-topline"><Link to="/study" className="page-back">← Study Hub</Link><span>THE ELEMENT ATLAS / 118 ENTRIES</span></div>
      <header className="pt-hero">
        <div>
          <p className="eyebrow">PATTERNS IN MATTER</p>
          <h1 className="display">A map of <br /><em>everything elemental.</em></h1>
          <p>Explore all 118 elements. Search a name, trace a family, then open an atom to see what its number means.</p>
        </div>
        <div className={`pt-hero-feature pt-cat-${selected.category}`}>
          <span className="pt-feature-index">CURRENT SELECTION <b>{String(selected.atomicNumber).padStart(3, '0')}</b></span>
          <span className="pt-feature-symbol" aria-hidden="true">{selected.symbol}</span>
          <span className="pt-feature-name">{selected.name}</span>
          <span className="pt-feature-meta">{elementCategoryLabels[selected.category]} / {selected.atomicMass}</span>
        </div>
      </header>

      <section className="pt-explorer" aria-labelledby="pt-explorer-title">
        <div className="pt-section-line"><div><span className="eyebrow">01 / ELEMENT INDEX</span><h2 id="pt-explorer-title">The periodic table</h2></div><span>118 ELEMENTS · 18 GROUPS · 7 PERIODS</span></div>
        <div className="pt-controls">
          <label className="pt-search"><span>Find an element</span><input type="search" value={search} onChange={(event) => updateParam('q', event.target.value)} placeholder="Name, symbol, or number" /></label>
          <label><span>Group</span><select value={group ?? 'all'} onChange={(event) => updateParam('group', event.target.value === 'all' ? undefined : event.target.value)}><option value="all">All groups</option>{Array.from({ length: 18 }, (_, index) => <option value={index + 1} key={index + 1}>Group {index + 1}</option>)}</select></label>
          <label><span>Category</span><select value={category ?? 'all'} onChange={(event) => updateParam('category', event.target.value === 'all' ? undefined : event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option value={item} key={item}>{elementCategoryLabels[item]}</option>)}</select></label>
          <button className="pt-reset" type="button" onClick={resetFilters} disabled={!search && group === undefined && category === undefined}>Reset filters</button>
        </div>
        <div className="pt-filter-caption" aria-live="polite"><p>{filterDescription}</p><span>{filteredElements.length} {filteredElements.length === 1 ? 'match' : 'matches'}</span></div>
        <p className="pt-scroll-hint">Scroll sideways to see all 18 groups <span aria-hidden="true">→</span></p>
        <div className="pt-table-scroll" role="region" aria-label="Periodic table of 118 elements, horizontally scrollable" tabIndex={0}>
          <div className="pt-grid" aria-label="Periodic table">
            {Array.from({ length: 18 }, (_, index) => <span className="pt-group-number" style={{ gridColumn: index + 2, gridRow: 1 }} key={`g-${index}`}>{index + 1}</span>)}
            {Array.from({ length: 7 }, (_, index) => <span className="pt-period-number" style={{ gridColumn: 1, gridRow: index + 2 }} key={`p-${index}`}>{index + 1}</span>)}
            <span className="pt-period-number" style={{ gridColumn: 1, gridRow: 9 }} aria-label="Lanthanoids">Ln</span>
            <span className="pt-period-number" style={{ gridColumn: 1, gridRow: 10 }} aria-label="Actinoids">An</span>
            <span className="pt-series-marker" style={{ gridColumn: 4, gridRow: 7 }}>57–71 <small>SEE BELOW ↓</small></span>
            <span className="pt-series-marker" style={{ gridColumn: 4, gridRow: 8 }}>89–103 <small>SEE BELOW ↓</small></span>
            {elements.map((element) => {
              const matching = matches.has(element.atomicNumber);
              return (
                <button
                  key={element.atomicNumber}
                  type="button"
                  className={`pt-tile pt-cat-${element.category} ${selected.atomicNumber === element.atomicNumber ? 'is-selected' : ''} ${matching ? '' : 'is-dimmed'}`}
                  style={{ gridColumn: element.tableColumn + 1, gridRow: element.tableRow + 1 }}
                  onClick={() => chooseElement(element)}
                  aria-pressed={selected.atomicNumber === element.atomicNumber}
                  aria-label={`${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}, atomic mass ${element.atomicMass}, ${elementCategoryLabels[element.category]}`}
                  disabled={!matching}
                >
                  <span className="pt-tile-number">{element.atomicNumber}</span>
                  <strong className="pt-tile-symbol">{element.symbol}</strong>
                  <span className="pt-tile-name">{element.name}</span>
                  <span className="pt-tile-mass">{element.atomicMass}</span>
                  <span className="pt-tile-preview" aria-hidden="true"><b>{element.name}</b><small>{elementCategoryLabels[element.category]} · {element.atomicMass}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        {filteredElements.length === 0 && <p className="pt-no-results" role="status">No elements match those filters. Adjust the search or reset filters.</p>}
        <div className="pt-legend" aria-label="Element category legend">
          <span>COLOR KEY</span>
          {categories.map((item) => <button key={item} type="button" className={`pt-legend-item pt-cat-${item} ${category === item ? 'is-active' : ''}`} onClick={() => updateParam('category', category === item ? undefined : item)} aria-pressed={category === item}><i aria-hidden="true" />{elementCategoryLabels[item]}</button>)}
        </div>
      </section>

      <section className="pt-detail-section" aria-label="Selected element details">
        <div className="pt-detail-intro"><span className="eyebrow">02 / CLOSE LOOK</span><h2>One square.<br />A whole story.</h2><p>Select a tile to pin its details. The group and category filters reveal patterns across the full table.</p><a href="https://iupac.org/what-we-do/periodic-table-of-elements/" target="_blank" rel="noreferrer">Explore IUPAC’s periodic table ↗</a></div>
        <aside className="pt-desktop-inspector"><ElementInspector element={selected} matching={matches.has(selected.atomicNumber)} /></aside>
      </section>

      <button type="button" className="pt-mobile-inspector-button" onClick={() => setMobileInspectorOpen(true)}>Inspect {selected.name} <span aria-hidden="true">↑</span></button>
      <dialog className="pt-mobile-dialog" ref={dialogRef} onClose={() => setMobileInspectorOpen(false)} aria-label={`${selected.name} element details`}>
        <div className="pt-mobile-dialog-header"><span>ELEMENT INSPECTOR</span><button type="button" onClick={() => setMobileInspectorOpen(false)} aria-label="Close element inspector">Close ×</button></div>
        <ElementInspector element={selected} matching={matches.has(selected.atomicNumber)} />
      </dialog>
    </main>
  );
}
