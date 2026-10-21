import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { mpdBridgePlugin } from './src/server/viteMpdPlugin.ts';

export default defineConfig(() => {
  // When the standalone server (server.ts) embeds Vite in middleware mode it
  // already owns the MPD bridge, so the plugin must not open a second one.
  const embeddedServer = process.env.FMPD_EMBEDDED_SERVER === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(embeddedServer ? [] : [mpdBridgePlugin()]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
