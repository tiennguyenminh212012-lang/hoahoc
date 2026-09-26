import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'github-pages' && repositoryName
    ? repositoryName.endsWith('.github.io') ? '/' : `/${repositoryName}/`
    : './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
  },
}))
