import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // A dedicated port (5173 is often taken by other projects), and open the
  // browser at the address the server actually ends up on.
  server: { port: 5175, open: true },
})
