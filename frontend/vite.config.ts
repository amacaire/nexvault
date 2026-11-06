import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const certPath = '/home/widunix/nexvault/frontend/certs/nexvault-cert.pem'
const keyPath = '/home/widunix/nexvault/frontend/certs/nexvault-key.pem'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  },
})
