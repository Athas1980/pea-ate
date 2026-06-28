import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { marked } from 'marked'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Single source of truth for the displayed version: package.json (kept in sync
// with the git tag by release.sh). Reading it here works locally and on Netlify,
// avoiding any dependency on git tags being present at build time.
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
)

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
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss(), markdownPlugin()],
  server: {
    allowedHosts: ['bazzite.local'],
  },
  test: {
    environment: 'node',
  },
})
