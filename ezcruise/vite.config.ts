import { defineConfig, searchForWorkspaceRoot  } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
  server: {
    fs: {
      allow: [
        // Search up for workspace root
        searchForWorkspaceRoot(process.cwd()),
        // Or specify the specific path to node_modules if needed
        '../node_modules/leaflet/dist/images'
      ],
    },
  }
})
