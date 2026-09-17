import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { MpdBridgeClient } from './src/server/mpdBridge';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // In-memory active MPD bridge client instance
  let mpdBridge = new MpdBridgeClient(
    process.env.MPD_HOST || 'localhost',
    parseInt(process.env.MPD_PORT || '6600', 10),
    process.env.MPD_PASSWORD
  );

  // WebSocket Server for real-time MPD bridge
  const wss = new WebSocketServer({ server, path: '/api/mpd-ws' });

  wss.on('connection', (ws) => {
    console.log('[WS Bridge] Client connected');

    // Send initial connection state
    ws.send(
      JSON.stringify({
        type: 'bridge_status',
        connected: mpdBridge.getConnected(),
      })
    );

    // If connected, send current status
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

  // REST API Endpoints for MPD control & status
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

      // Broadcast to WS clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'bridge_status', connected }));
        }
      });

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

  // Attempt initial background connection (silent if localhost:6600 is not running yet)
  mpdBridge.connect().catch(() => {});

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FMPD Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
