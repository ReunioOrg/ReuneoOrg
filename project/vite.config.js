import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Dev-only. Vite's public-file middleware skips extensionless URLs, and the
// SPA fallback looks for index.html in the project root rather than public/.
// /blog/ therefore serves the React shell in `vite dev`. Production static
// hosting (and `vite preview` of dist/) already serves public/blog/index.html.
function devPublicDirectoryIndex() {
  return {
    name: 'dev-public-directory-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url || ''
        const q = raw.indexOf('?')
        let pathname = q === -1 ? raw : raw.slice(0, q)
        const search = q === -1 ? '' : raw.slice(q)
        try {
          pathname = decodeURIComponent(pathname)
        } catch {
          return next()
        }
        if (!pathname.startsWith('/') || pathname.includes('..') || path.posix.extname(pathname)) {
          return next()
        }
        const publicDir = server.config.publicDir
        if (!publicDir) return next()
        const dir = pathname.endsWith('/') ? pathname.slice(1) : `${pathname.slice(1)}/`
        const indexRel = `${dir}index.html`
        if (fs.existsSync(path.join(publicDir, indexRel))) {
          req.url = `/${indexRel}${search}`
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [devPublicDirectoryIndex(), react()],
  assetsInclude: ['**/*.mp3', '**/*.mp4'],
  //base: '/MeetFrontend/',
  base: '/',
  // base: '192.168.1.70:8080/',
  server: {
    host: 'localhost',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    outDir: 'dist'
  },
})