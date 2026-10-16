import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Custom plugin to ensure Android APK files are served with the authoritative
 * MIME type and Content-Disposition headers. This prevents mobile browsers (Chrome,
 * Samsung Internet) from mistaking the APK (which uses ZIP container format) for a .zip file.
 */
const apkMimePlugin = (): Plugin => ({
  name: 'apk-mime-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split('?')[0] : '';
      if (url.endsWith('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="RemiVault.apk"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apkMimePlugin()],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) so phone on same Wi-Fi can connect
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
