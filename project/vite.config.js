import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3', '**/*.mp4'],
  //base: '/MeetFrontend/',
  base: '/',
  // base: '192.168.1.70:8080/',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: '../'
  },
})