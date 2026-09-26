import { Component, Suspense, lazy, type ReactNode } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { GlobalHeader } from '../components/layout/GlobalHeader'

const Welcome = lazy(() => import('../pages/Welcome'))
const StudyHub = lazy(() => import('../pages/StudyHub'))
const AtomExplorer = lazy(() => import('../pages/AtomExplorer'))
const FreeArea = lazy(() => import('../pages/FreeArea'))
const PeriodicTable = lazy(() => import('../pages/PeriodicTable'))
const BondingLab = lazy(() => import('../pages/BondingLab'))
const PolyatomicIons = lazy(() => import('../pages/PolyatomicIons'))
const ChemicalReactions = lazy(() => import('../pages/ChemicalReactions'))
const ModelGallery = lazy(() => import('../pages/ModelGallery'))
const ModelViewer = lazy(() => import('../pages/ModelViewer'))
const NotFound = lazy(() => import('../pages/NotFound'))

class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="container page-intro"><p className="eyebrow">Model unavailable</p><h1 className="section-heading">This exhibit could not load.</h1><p>Try reloading, or return to the Study Hub.</p><Link className="button button-primary" to="/study">Study Hub</Link></main>
    return this.props.children
  }
}

export default function App() {
  return (
    <HashRouter>
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
      <div className="site-shell">
        <GlobalHeader />
        <PageErrorBoundary>
          <Suspense fallback={<main className="container page-intro" role="status"><p className="eyebrow">CHEMISTRY</p><h1 className="section-heading">Preparing exhibit…</h1></main>}>
            <div id="main-content" className="site-main" tabIndex={-1}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/study" element={<StudyHub />} />
                <Route path="/study/atoms" element={<AtomExplorer />} />
                <Route path="/study/free-area" element={<FreeArea />} />
                <Route path="/study/periodic-table" element={<PeriodicTable />} />
                <Route path="/study/bonding" element={<BondingLab />} />
                <Route path="/study/polyatomic-ions" element={<PolyatomicIons />} />
                <Route path="/study/reactions" element={<ChemicalReactions />} />
                <Route path="/models" element={<ModelGallery />} />
                <Route path="/models/:modelId" element={<ModelViewer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </PageErrorBoundary>
      </div>
    </HashRouter>
  )
}
