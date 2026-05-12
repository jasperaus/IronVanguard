import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  define: {
    // Override the hardcoded vite define for testing to allow dynamic process.env
    // But since it literally does `geminiApiKey = process.env.GEMINI_API_KEY || ""`
    // Let's replace it with a string getter or something, wait no:
    // If we define it to literally be process.env.GEMINI_API_KEY without quotes, it gets evaluated.
    'process.env.GEMINI_API_KEY': 'process.env.GEMINI_API_KEY'
    // This is actually what we want.
  }
})
