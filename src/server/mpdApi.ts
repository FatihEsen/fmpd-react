/**
 * Shared HTTP + WebSocket transport for the MPD bridge.
 *
 * Both the Vite dev plugin (src/server/viteMpdPlugin.ts) and the standalone
 * production server (server.ts) mount these, so the API surface can never
 * drift apart between environments.
 */

import express, { Request, Response } from 'express';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { MpdService } from './mpdService.ts';

/**
 * Minimal structural type of an HTTP server that can handle WebSocket
 * upgrades. Vite types `httpServer` as `HttpServer | Http2SecureServer`, so
 * we only rely on the `upgrade` event here.
 */
export interface UpgradeCapableServer {
  on(
    event: 'upgrade',
    listener: (request: any, socket: Duplex, head: Buffer) => void
  ): unknown;
}

/**
 * Builds the MPD REST API as a self-contained express app.
 *
 * A full express app (instead of a bare `express.Router()`) is required
 * because it is mounted into Vite's connect middleware stack, where the
 * `expressInit` middleware that adds `res.status` / `res.json` would
 * otherwise never run.
 */
export function createMpdApiApp(service: MpdService): express.Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // --- Connection state ---
  app.get('/status', async (_req: Request, res: Response) => {
    try {
      if (!service.isConnected()) {
        return res.json({ connected: false, error: 'MPD not connected' });
      }
      const status = await service.getClient().getStatus();
      res.json({ connected: true, status });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err?.message || 'Unknown error' });
    }
  });

  app.post('/connect', async (req: Request, res: Response) => {
    const { host, port, password } = req.body || {};
    try {
      const connected = await service.connect(
        host || undefined,
        port ? Number(port) : undefined,
        password === undefined ? undefined : String(password)
      );
      res.json({
        success: connected,
        host: service.getTarget().host,
        port: service.getTarget().port,
        error: connected ? undefined : 'MPD not reachable',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Unknown error' });
    }
  });

  // --- Raw MPD command passthrough ---
  app.post('/command', async (req: Request, res: Response) => {
    const { command } = req.body || {};
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Missing command' });
    }
    try {
      if (!service.isConnected()) {
        return res.status(400).json({ error: 'MPD not connected' });
      }
      const lines = await service.getClient().sendCommand(command);
      // Push the resulting state right away instead of waiting for the
      // next poll tick, so button presses feel instant.
      service.refreshStatus();
      res.json({ success: true, result: lines });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  });

  // --- Batch of MPD commands (single round trip) ---
  app.post('/commands', async (req: Request, res: Response) => {
    const { commands } = req.body || {};
    if (!Array.isArray(commands) || commands.length === 0) {
      return res.status(400).json({ error: 'Missing commands' });
    }
    if (commands.some((c) => typeof c !== 'string')) {
      return res.status(400).json({ error: 'Commands must be strings' });
    }
    try {
      if (!service.isConnected()) {
        return res.status(400).json({ error: 'MPD not connected' });
      }
      const results = await service.sendCommands(commands);
      service.refreshStatus();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  });

  // --- Queue ---
  app.get('/queue', async (_req: Request, res: Response) => {
    try {
      if (!service.isConnected()) {
        return res.json({ queue: [] });
      }
      const queue = await service.getClient().getQueue();
      res.json({ queue });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  });

  // --- Library ---
  app.get('/library', async (req: Request, res: Response) => {
    try {
      if (!service.isConnected()) {
        return res.json({ folders: [], songs: [] });
      }
      const path = (req.query.path as string) || '';
      const data = await service.getClient().getLibrary(path);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  });

  app.get('/all-songs', async (_req: Request, res: Response) => {
    try {
      if (!service.isConnected()) {
        return res.json({ songs: [] });
      }
      const songs = await service.getClient().getAllSongs();
      res.json({ songs });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  });

  return app;
}

/**
 * Attaches the MPD WebSocket endpoint to an HTTP server.
 *
 * The endpoint lives on `/api/mpd-ws` and pushes two message types:
 *   - `bridge_status` -> { connected: boolean }
 *   - `status`        -> { data: MpdServerStatus }
 *
 * A single subscription on the service fans the payload out to every client,
 * so N browsers do not mean N MPD pollers.
 */
export function attachMpdWebSocket(httpServer: UpgradeCapableServer, service: MpdService): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url?.split('?')[0];
    if (url === '/api/mpd-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Other upgrade requests (e.g. Vite HMR) are left untouched.
  });

  const broadcast = (payload: Record<string, unknown>) => {
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  service.on('status', (status) => broadcast({ type: 'status', data: status }));
  service.on('bridge_status', (connected) => broadcast({ type: 'bridge_status', connected }));

  wss.on('connection', (ws: WebSocket) => {
    ws.send(
      JSON.stringify({
        type: 'bridge_status',
        connected: service.isConnected(),
      })
    );

    if (service.isConnected()) {
      service
        .getClient()
        .getStatus()
        .then((status) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'status', data: status }));
          }
        })
        .catch(() => {
          /* status could not be read, the periodic push will catch up */
        });
    }

    ws.on('message', async (raw) => {
      let id: unknown;
      try {
        const msg = JSON.parse(raw.toString());
        id = msg?.id;
        if (msg?.cmd) {
          const result = await service.getClient().sendCommand(msg.cmd);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'cmd_result', id, data: result }));
          }
        }
      } catch (err: any) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', id, message: err?.message || 'Error' }));
        }
      }
    });

    ws.on('error', () => {
      /* client vanished mid-flight */
    });
  });

  return wss;
}
