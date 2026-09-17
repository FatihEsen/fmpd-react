/**
 * Vite plugin that integrates the MPD TCP Socket and WebSocket bridge
 * Directly inside Vite dev server (runs cleanly in both Cloud Preview and Local npm run dev)
 */

import { Plugin } from 'vite';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { MpdBridgeClient } from './mpdBridge';

export function mpdBridgePlugin(): Plugin {
  return {
    name: 'mpd-bridge-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json());

      let mpdBridge = new MpdBridgeClient(
        process.env.MPD_HOST || 'localhost',
        parseInt(process.env.MPD_PORT || '6600', 10),
        process.env.MPD_PASSWORD
      );

      let wssInstance: WebSocketServer | null = null;

      // Attach WebSocket server on the Vite HTTP server
      if (server.httpServer) {
        const wss = new WebSocketServer({
          noServer: true,
        });
        wssInstance = wss;

        server.httpServer.on('upgrade', (request, socket, head) => {
          if (request.url === '/api/mpd-ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request);
            });
          }
        });

        wss.on('connection', (ws) => {
          ws.send(
            JSON.stringify({
              type: 'bridge_status',
              connected: mpdBridge.getConnected(),
            })
          );

          if (mpdBridge.getConnected()) {
            mpdBridge.getStatus().then((st) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'status', data: st }));
              }
            });
          }

          const onStatus = (st: any) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'status', data: st }));
            }
          };

          mpdBridge.on('status', onStatus);

          ws.on('message', async (raw) => {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.cmd) {
                const res = await mpdBridge.sendCommand(msg.cmd);
                ws.send(JSON.stringify({ type: 'cmd_result', id: msg.id, data: res }));
              }
            } catch (err: any) {
              ws.send(JSON.stringify({ type: 'error', message: err?.message || 'Error' }));
            }
          });

          ws.on('close', () => {
            mpdBridge.off('status', onStatus);
          });
        });
      }

      // REST Endpoints
      app.get('/api/mpd/status', async (req, res) => {
        try {
          if (!mpdBridge.getConnected()) {
            return res.json({ connected: false, error: 'MPD not connected' });
          }
          const status = await mpdBridge.getStatus();
          res.json({ connected: true, status });
        } catch (err: any) {
          res.status(500).json({ connected: false, error: err.message });
        }
      });

      app.post('/api/mpd/connect', async (req, res) => {
        const { host, port, password } = req.body;
        try {
          mpdBridge.disconnect();
          mpdBridge = new MpdBridgeClient(host || 'localhost', port || 6600, password);
          const connected = await mpdBridge.connect();
          
          if (wssInstance) {
            wssInstance.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'bridge_status', connected }));
              }
            });
          }

          res.json({ success: connected, host, port });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      app.post('/api/mpd/command', async (req, res) => {
        const { command } = req.body;
        try {
          if (!mpdBridge.getConnected()) {
            return res.status(400).json({ error: 'MPD not connected' });
          }
          const lines = await mpdBridge.sendCommand(command);
          res.json({ success: true, result: lines });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      app.get('/api/mpd/queue', async (req, res) => {
        try {
          if (!mpdBridge.getConnected()) {
            return res.json({ queue: [] });
          }
          const queue = await mpdBridge.getQueue();
          res.json({ queue });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      app.get('/api/mpd/library', async (req, res) => {
        try {
          if (!mpdBridge.getConnected()) {
            return res.json({ folders: [], songs: [] });
          }
          const p = (req.query.path as string) || '';
          const data = await mpdBridge.getLibrary(p);
          res.json(data);
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      app.get('/api/mpd/all-songs', async (req, res) => {
        try {
          if (!mpdBridge.getConnected()) {
            return res.json({ songs: [] });
          }
          const songs = await mpdBridge.getAllSongs();
          res.json({ songs });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      // Silently attempt initial background connection on server start
      mpdBridge.connect().catch(() => {});

      // Mount the express router into Vite middlewares
      server.middlewares.use(app);
    },
  };
}
