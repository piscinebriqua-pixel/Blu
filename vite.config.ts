import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const buildTime = Date.now().toString()

// Génère automatiquement public/version.json pour la détection de mise à jour en temps réel
try {
  const publicDir = path.resolve(__dirname, 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.writeFileSync(
    path.join(publicDir, 'version.json'),
    JSON.stringify({ version: buildTime, builtAt: new Date().toISOString() }, null, 2)
  )
} catch (e) {
  console.warn('Impossible de générer version.json:', e)
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow access from mobile devices on the same network
  },
  build: {
    target: 'esnext',
  }
})
