import { defineConfig, searchForWorkspaceRoot  } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json';

export default defineConfig(({ }) => {
  // 'serve' is used for local dev, 'build' for production builds
  const major_ver = pkg.version.split('.')[0];
  const minor_ver = pkg.version.split('.')[1];
  const patch_ver = pkg.version.split('.')[2];
  // const app = command === 'build' ? 'app' : 'dev';
  // If this is GitHub pages CI build then the root needs to be adjusted
  const app = process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME === 'main' ? 'app' : 'dev';
  const root = process.env.GITHUB_ACTIONS ? `/ezcruise/timber/v${major_ver}/${app}/` : `/${app}/`;
  
  return {
    base: root,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'EZ Cruise - Timber',
          short_name: 'EZ Timber',
          description: 'An offline focused application for forest inventory and cruising.',
          id: 'ezcruise-app-v3',
          start_url: './index.html',
          display: 'standalone',
          orientation: 'any',
          lang: 'en-US',
          dir: 'ltr',
          background_color: '#f4f6f5',
          theme_color: '#2f6f4e',
          icons: [
            {
              src: './assets/images/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: './assets/images/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
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
    },
    define: {
      'APP_MAJOR_VERSION': JSON.stringify(major_ver),
      'APP_MINOR_VERSION': JSON.stringify(minor_ver),
      'APP_PATCH_VERSION': JSON.stringify(patch_ver)
    }
  }
})
