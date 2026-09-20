import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // A dedicated port so this app never clashes with MovieHouse (5175) or other
  // projects, and open the browser at the address the server actually ends up on.
  server: { port: 5174, open: true },
})
