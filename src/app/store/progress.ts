import { create } from 'zustand'

export type TopicId = 'atoms' | 'periodic-table' | 'bonding' | 'polyatomic-ions' | 'reactions'
export type GraphicsQuality = 'auto' | 'high' | 'low'
export type MotionPreference = 'full' | 'reduced'

interface SavedProgress {
  visited: Partial<Record<TopicId, string>>
  completedSteps: Partial<Record<TopicId, number>>
  ionPractice: Record<string, { correct: number; review: number }>
  lastElement: number
  recentElements: number[]
  quality: GraphicsQuality
  motion: MotionPreference
}

interface ProgressState extends SavedProgress {
  visit: (topic: TopicId) => void
  completeStep: (topic: TopicId, step: number) => void
  practiceIon: (id: string, correct: boolean) => void
  selectElement: (number: number) => void
  setQuality: (quality: GraphicsQuality) => void
  setMotion: (motion: MotionPreference) => void
}

const key = 'chemistry-site-progress-v1'
const reducedBySystem = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const initial: SavedProgress = {
  visited: {},
  completedSteps: {},
  ionPractice: {},
  lastElement: 11,
  recentElements: [],
  quality: 'auto',
  motion: reducedBySystem ? 'reduced' : 'full',
}

function load(): SavedProgress {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as Partial<SavedProgress>
    return {
      ...initial,
      visited: parsed.visited && typeof parsed.visited === 'object' ? parsed.visited : {},
      completedSteps: parsed.completedSteps && typeof parsed.completedSteps === 'object' ? parsed.completedSteps : {},
      ionPractice: parsed.ionPractice && typeof parsed.ionPractice === 'object' ? parsed.ionPractice : {},
      lastElement: typeof parsed.lastElement === 'number' ? parsed.lastElement : 11,
      recentElements: Array.isArray(parsed.recentElements) ? parsed.recentElements.filter((n): n is number => typeof n === 'number').slice(0, 5) : [],
      quality: parsed.quality === 'high' || parsed.quality === 'low' ? parsed.quality : 'auto',
      motion: parsed.motion === 'full' || parsed.motion === 'reduced' ? parsed.motion : initial.motion,
    }
  } catch {
    return initial
  }
}

export const useProgress = create<ProgressState>((set) => ({
  ...load(),
  visit: (topic) => set((state) => ({ visited: { ...state.visited, [topic]: new Date().toISOString() } })),
  completeStep: (topic, step) => set((state) => ({ completedSteps: { ...state.completedSteps, [topic]: Math.max(step, state.completedSteps[topic] ?? 0) } })),
  practiceIon: (id, correct) => set((state) => {
    const previous = state.ionPractice[id] ?? { correct: 0, review: 0 }
    return { ionPractice: { ...state.ionPractice, [id]: { correct: previous.correct + Number(correct), review: previous.review + Number(!correct) } } }
  }),
  selectElement: (number) => set((state) => ({ lastElement: number, recentElements: [number, ...state.recentElements.filter((n) => n !== number)].slice(0, 5) })),
  setQuality: (quality) => set({ quality }),
  setMotion: (motion) => set({ motion }),
}))

useProgress.subscribe((state) => {
  try {
    const { visited, completedSteps, ionPractice, lastElement, recentElements, quality, motion } = state
    localStorage.setItem(key, JSON.stringify({ visited, completedSteps, ionPractice, lastElement, recentElements, quality, motion }))
  } catch {
    // Private browsing or full storage should not stop learning.
  }
})
