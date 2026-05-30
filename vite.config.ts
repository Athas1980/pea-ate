import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { marked } from 'marked'

function markdownPlugin(): Plugin {
  return {
    name: 'markdown',
    transform(code, id) {
      if (!id.endsWith('.md')) return
      const html = marked.parse(code) as string
      return `export default ${JSON.stringify(html)}`
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), markdownPlugin()],
  server: {
    allowedHosts: ['bazzite.local'],
  },
  test: {
    environment: 'node',
  },
})
