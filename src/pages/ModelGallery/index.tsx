import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { modelCategories, models, type ModelCategory } from './models'
import './model-gallery.css'

export default function ModelGallery() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ModelCategory | 'All'>('All')
  const filtered = useMemo(() => models.filter((model) => (category === 'All' || model.category === category) && `${model.name} ${model.formula} ${model.description}`.toLowerCase().includes(query.toLowerCase().trim())), [query, category])
  return <main className="container gallery-page">
    <div className="gallery-heading"><div><Link className="page-back" to="/"><ArrowLeft size={16} aria-hidden="true" /> Home</Link><p className="eyebrow">3D model gallery</p><h1 className="section-heading">Matter, up close.</h1><p>Rotate, zoom, and inspect the models behind each lesson. These are educational representations; sizes and distances are not to scale.</p><Link className="button button-subtle gallery-free-area" to="/study/free-area">Build your own in Free Area <ArrowUpRight size={16} aria-hidden="true" /></Link></div><span className="gallery-count">{models.length.toString().padStart(2, '0')} models</span></div>
    <div className="gallery-controls"><label className="gallery-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search models" aria-label="Search models" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="gallery-filters" role="group" aria-label="Model categories">{(['All', ...modelCategories] as const).map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
    <p className="gallery-result-count" role="status">Showing {filtered.length} {filtered.length === 1 ? 'model' : 'models'}</p>
    {filtered.length ? <div className="gallery-grid">{filtered.map((model, index) => <Link key={model.id} className={`model-card model-card-${model.category.toLowerCase()}`} to={`/models/${model.id}`}><div className="model-card-top"><span>{String(index + 1).padStart(2, '0')} / {model.category}</span><ArrowUpRight size={20} aria-hidden="true" /></div><div className="model-card-visual" aria-hidden="true"><span>{model.category === 'Reactions' ? '⇄' : model.formula}</span></div><div className="model-card-copy"><h2>{model.name}</h2><p>{model.description}</p><span className="model-open">Open Model ↗</span></div></Link>)}</div> : <div className="gallery-empty surface"><h2>No matching model</h2><p>Try a different name or clear the category filter.</p><button type="button" className="button" onClick={() => { setQuery(''); setCategory('All') }}>Show all models</button></div>}
  </main>
}
