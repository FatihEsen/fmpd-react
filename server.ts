/**
 * FMPD standalone server (production).
 *
 * Serves the built frontend from `dist/` and exposes the MPD bridge
 * (REST + WebSocket). When no production build exists it falls back to the
 * Vite dev middleware so that `npm start` always yields a working app.
 */

import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { MpdService } from './src/server/mpdService.ts';
import { createMpdApiApp, attachMpdWebSocket } from './src/server/mpdApi.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const service = new MpdService(
    process.env.MPD_HOST || 'localhost',
    parseInt(process.env.MPD_PORT || '6600', 10),
    process.env.MPD_PASSWORD
  );

  // REST + WebSocket bridge
  app.use('/api/mpd', createMpdApiApp(service));
  attachMpdWebSocket(server, service);

  // Attempt initial background connection (silent if MPD is not running yet)
  service.connect().catch(() => {});

  // Frontend assets
  const distPath = path.join(process.cwd(), 'dist');
  const hasProductionBuild = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasProductionBuild && process.env.NODE_ENV !== 'development') {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[FMPD Server] Serving production build from ./dist');
  } else {
    // No build available (or explicit dev mode): run Vite in middleware mode.
    // The embedded bridge is disabled to avoid a second MPD connection.
    process.env.FMPD_EMBEDDED_SERVER = 'true';
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[FMPD Server] No production build found - running Vite in middleware mode');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FMPD Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FMPD Server] Fatal startup error:', err);
  process.exit(1);
});
