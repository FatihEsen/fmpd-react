/**
 * Vite plugin that mounts the MPD bridge into the Vite dev server.
 *
 * The heavy lifting lives in ../server/mpdApi.ts so that the dev server and
 * the standalone production server expose exactly the same API.
 */

import { Plugin } from 'vite';
import { MpdService } from './mpdService.ts';
import { createMpdApiApp, attachMpdWebSocket } from './mpdApi.ts';

export function mpdBridgePlugin(): Plugin {
  return {
    name: 'mpd-bridge-plugin',
    configureServer(server) {
      const service = new MpdService(
        process.env.MPD_HOST || 'localhost',
        parseInt(process.env.MPD_PORT || '6600', 10),
        process.env.MPD_PASSWORD
      );

      server.middlewares.use('/api/mpd', createMpdApiApp(service));

      if (server.httpServer) {
        attachMpdWebSocket(server.httpServer, service);
      }

      // Silently attempt an initial background connection on server start.
      service.connect().catch(() => {});
    },
  };
}
