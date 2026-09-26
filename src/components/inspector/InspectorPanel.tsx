import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface InspectorPanelProps {
  title: string
  symbol?: string
  summary: string
  role?: string
  why?: string
  changed?: string
  detail?: ReactNode
  source?: { label: string; url: string }
  className?: string
  onClose?: () => void
}

export function InspectorPanel({ title, symbol, summary, role, why, changed, detail, source, className, onClose }: InspectorPanelProps) {
  return (
    <aside className={`inspector-panel surface ${className ?? ''}`} aria-label={`${title} inspector`}>
      <div className="inspector-head"><div><span className="eyebrow">Inspector</span><h2>{title}</h2></div>{onClose && <button type="button" className="inspector-close" aria-label="Close inspector" onClick={onClose}><X size={18} /></button>}</div>
      {symbol && <div className="inspector-symbol">{symbol}</div>}
      <p className="inspector-summary">{summary}</p>
      {role && <div className="inspector-section"><h3>Role in this model</h3><p>{role}</p></div>}
      {why && <div className="inspector-section"><h3>Why does this happen?</h3><p>{why}</p></div>}
      {changed && <div className="inspector-section"><h3>What changed?</h3><p>{changed}</p></div>}
      {detail && <div className="inspector-section inspector-detail"><h3>Look closer</h3>{detail}</div>}
      {source && <a className="inspector-source" href={source.url} target="_blank" rel="noreferrer">Read more: {source.label} ↗</a>}
    </aside>
  )
}
