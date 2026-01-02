import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  plugins: [react({
    babel: {
      plugins: [['module:@preact/signals-react-transform']],
    },
  })],
})
