import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && process.env.VERCEL === '1') {
    const apiBase = (process.env.VITE_API_BASE ?? loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE)?.trim()
    const setupMessage = 'Set VITE_API_BASE in Vercel to the public HTTPS Railway API origin (without /v1), then redeploy.'
    if (!apiBase) throw new Error(setupMessage)
    let url: URL
    try { url = new URL(apiBase) } catch { throw new Error(setupMessage) }
    const localHost = url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.startsWith('127.') || url.hostname === '[::1]'
    if (url.protocol !== 'https:' || localHost || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error(setupMessage)
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'license-page-route',
        configureServer(server) {
          // Windows resolves /license to the root LICENSE file before SPA fallback.
          server.middlewares.use((request, _response, next) => {
            if (request.url?.split('?')[0] === '/license' && request.headers.accept?.includes('text/html')) request.url = '/index.html'
            next()
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
