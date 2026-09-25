import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En dev sans Docker (npm run dev), on proxifie vers l'API locale — en Docker,
    // c'est nginx qui joue ce rôle (nginx/nginx.conf), ce bloc n'intervient pas.
    proxy: {
      '/api': 'http://localhost:3000',
      '/about.json': 'http://localhost:3000',
    },
  },
})
