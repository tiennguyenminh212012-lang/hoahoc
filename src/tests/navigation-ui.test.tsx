import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import App from '../app/App'
import { useProgress } from '../app/store/progress'

vi.mock('../scenes/shared/SceneViewport', () => ({
  SceneViewport: ({ children }: { children: ReactNode }) => <div data-testid="mock-scene">{children}</div>,
}))
vi.mock('../scenes/atom/AtomScene', () => ({
  AtomScene: ({ onSelect, mode }: { onSelect?: (selection: { kind: string }) => void; mode: string }) => <button type="button" data-mode={mode} onClick={() => onSelect?.({ kind: 'nucleus' })}>Choose nucleus</button>,
}))

beforeEach(() => {
  localStorage.clear()
  useProgress.setState({ visited: {}, completedSteps: {}, lastElement: 11, recentElements: [], quality: 'auto', motion: 'reduced' })
  window.location.hash = '#/'
})

describe('learning navigation', () => {
  it('opens the Study Hub from the welcome page', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: /^Study$/ }))
    await waitFor(() => expect(window.location.hash).toBe('#/study'))
    expect(await screen.findByRole('link', { name: /Explore Atoms/i })).toBeInTheDocument()
  })

  it('updates the atom inspector when a nucleus is selected', async () => {
    window.location.hash = '#/study/atoms?element=11&isotope=23&view=cloud'
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Choose nucleus' }))
    expect(await screen.findByRole('heading', { name: 'Nucleus' })).toBeInTheDocument()
    expect(screen.getByText(/11 protons and 12 neutrons/)).toBeInTheDocument()
  })

  it('carries the selected element into Atom Explorer', async () => {
    window.location.hash = '#/study/periodic-table'
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: 'Open Atom' }))
    await waitFor(() => expect(window.location.hash).toContain('element=11'))
    expect(await screen.findByRole('heading', { name: 'Atom Explorer' })).toBeInTheDocument()
  })

  it('persists the graphics preference', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Graphics quality'), { target: { value: 'low' } })
    expect(useProgress.getState().quality).toBe('low')
    expect(JSON.parse(localStorage.getItem('chemistry-site-progress-v1') ?? '{}').quality).toBe('low')
  })

  it.each([
    ['hydrogen-1', '1'],
    ['sodium-23', '2, 8, 1'],
    ['chlorine-35', '2, 8, 7'],
  ])('shows basic electron shells in the %s gallery exhibit', async (modelId, arrangement) => {
    window.location.hash = `#/models/${modelId}`
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Basic electron shells' }, { timeout: 15000 }))
    expect(screen.getByRole('button', { name: 'Basic electron shells' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Choose nucleus' })).toHaveAttribute('data-mode', 'shell')
    expect(screen.getByText(new RegExp(`Basic shells: ${arrangement} electrons`))).toBeInTheDocument()
  })
})
