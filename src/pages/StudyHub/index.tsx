import { ArrowUpRight, Atom, Grid3X3, GitBranch, Layers3, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProgress, type TopicId } from '../../app/store/progress'
import './study-hub.css'

const topics: { id: TopicId; number: string; title: string; description: string; path: string; icon: typeof Atom; motif: string }[] = [
  { id: 'atoms', number: '01', title: 'Atoms', description: 'Inspect the nucleus and discover where electrons are likely to be found.', path: '/study/atoms', icon: Atom, motif: 'atom' },
  { id: 'periodic-table', number: '02', title: 'Periodic Table', description: 'Explore all 118 elements, their families, and repeating patterns.', path: '/study/periodic-table', icon: Grid3X3, motif: 'periodic' },
  { id: 'bonding', number: '03', title: 'Bonding Lab', description: 'Watch electrons transfer or become shared, then build supported compounds.', path: '/study/bonding', icon: GitBranch, motif: 'bonding' },
  { id: 'polyatomic-ions', number: '04', title: 'Polyatomic Ions', description: 'Learn formulas, charges, naming patterns, and practice recall.', path: '/study/polyatomic-ions', icon: Layers3, motif: 'ions' },
  { id: 'reactions', number: '05', title: 'Chemical Reactions', description: 'Follow atom rearrangements and balance equations with live counters.', path: '/study/reactions', icon: FlaskConical, motif: 'reactions' },
]

function TopicPreview({ motif }: { motif: string }) {
  if (motif === 'atom') return <div className="preview-atom" aria-hidden="true"><span className="preview-nucleus" /><i /><i /><i /><b /><b /><b /></div>
  if (motif === 'periodic') return <div className="preview-periodic" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} className={i === 14 ? 'lit' : ''}>{['H', 'Li', 'B', 'C', 'N', 'O', 'F', 'Ne'][i % 8]}</span>)}</div>
  if (motif === 'bonding') return <div className="preview-bonding" aria-hidden="true"><span>Na</span><i>e⁻</i><span>Cl</span></div>
  if (motif === 'ions') return <div className="preview-ions" aria-hidden="true"><span>NO<sub>3</sub><sup>−</sup></span><span>SO<sub>4</sub><sup>2−</sup></span></div>
  return <div className="preview-reaction" aria-hidden="true"><span>H₂</span><b>+</b><span>O₂</span><b>→</b><span>H₂O</span></div>
}

export default function StudyHub() {
  const visited = useProgress((state) => state.visited)
  return (
    <main className="container study-hub">
      <section className="page-intro study-intro">
        <p className="eyebrow">Choose an exhibit</p>
        <h1 className="section-heading">A universe of <br /><em>small things.</em></h1>
        <p>Start anywhere. Each exhibit pairs a clear explanation with something you can explore.</p>
      </section>
      <Link className="study-free-area" to="/study/free-area"><div><span className="eyebrow">Free Area / Particle workshop</span><h2>Make an atom. See what it becomes.</h2><p>Build a nucleus, arrange electrons, and test verified compounds and reactants.</p></div><span className="study-free-area-action">Enter Free Area <ArrowUpRight size={20} aria-hidden="true" /></span></Link>
      <div className="topic-grid">
        {topics.map(({ id, number, title, description, path, icon: Icon, motif }) => (
          <Link className={`topic-card topic-${motif}`} to={path} key={id} aria-label={`${visited[id] ? 'Continue' : 'Explore'} ${title}`}>
            <div className="topic-card-top"><span className="topic-number">{number} / 05</span><Icon size={24} strokeWidth={1.5} aria-hidden="true" /></div>
            <TopicPreview motif={motif} />
            <div className="topic-card-bottom"><div><span className="topic-status">{visited[id] ? 'Continue learning' : 'Start exploring'}</span><h2>{title}</h2><p>{description}</p></div><ArrowUpRight size={25} aria-hidden="true" /></div>
          </Link>
        ))}
      </div>
      <p className="footer-note study-footnote">Progress is saved on this device. Scientific visuals are teaching models and are not to scale.</p>
    </main>
  )
}
