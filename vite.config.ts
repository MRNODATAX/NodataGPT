import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

interface NodeLikeReq {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  on(event: 'data', listener: (chunk: unknown) => void): void;
  on(event: 'end', listener: () => void): void;
}

interface NodeLikeRes {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
}

function localProxyPlugin(): Plugin {
  return {
    name: 'nodatagpt-local-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', (rawReq, rawRes) => {
        const req = rawReq as unknown as NodeLikeReq;
        const res = rawRes as unknown as NodeLikeRes;

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        let bodyText = '';
        req.on('data', (chunk: unknown) => {
          bodyText += String(chunk);
        });
        req.on('end', async () => {
          try {
            const modulePath = './api/proxy.js';
            const mod = (await import(/* @vite-ignore */ modulePath)) as {
              default: (rq: unknown, rs: unknown) => Promise<void>;
            };
            const fakeReq = {
              method: req.method,
              headers: req.headers,
              body: bodyText,
            };
            const fakeRes = {
              setHeader: (k: string, v: string) => res.setHeader(k, v),
              status: (code: number) => {
                res.statusCode = code;
                return {
                  json: (obj: unknown) => {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(obj));
                  },
                  end: () => res.end(),
                };
              },
            };
            await mod.default(fakeReq, fakeRes);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                error: err instanceof Error ? err.message : 'Local proxy error',
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    localProxyPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: [
        'favicon.png',
        'apple-touch-icon.png',
        'logo.png',
        'logo-transparent.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],
      manifest: {
        id: '/',
        name: 'NodataGPT',
        short_name: 'NodataGPT',
        description: 'NodataGPT: Ruang Chat AI Multi-Model dengan Auto-Fallback dan PWA Android',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'id-ID',
        categories: ['productivity', 'utilities', 'developer'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Percakapan Baru',
            short_name: 'Chat Baru',
            description: 'Buka sesi percakapan baru di NodataGPT',
            url: '/?action=new',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'highlight.js'],
        },
      },
    },
  },
});
