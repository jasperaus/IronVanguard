import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  define: {
    'process.env.GEMINI_API_KEY': 'process.env.GEMINI_API_KEY'
  }
})
