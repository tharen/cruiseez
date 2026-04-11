import { defineConfig, searchForWorkspaceRoot  } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json';

export default defineConfig(({ command }) => {
  // 'serve' is used for local dev, 'build' for production builds
  const major_ver = pkg.version.split('.')[0];
  const minor_ver = pkg.version.split('.')[1];
  const patch_ver = pkg.version.split('.')[2];
  const app = command === 'build' ? 'app' : 'dev';
  const root = process.env.GITHUB_ACTIONS ? `/ezcruise/timber/${app}_v${major_ver}/` : `/${app}/`;

  return {
    base: root,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
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
