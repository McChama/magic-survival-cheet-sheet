import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/magic-survival-cheet-sheet/',
  plugins: [react()],
  server: {
    host: true,
  },
})
