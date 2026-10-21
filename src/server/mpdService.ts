/**
 * Shared MPD service layer.
 *
 * Owns exactly ONE MpdBridgeClient instance and forwards its events, so the
 * REST API and the WebSocket bridge can share the same MPD connection
 * regardless of whether the app runs in dev (Vite plugin) or production
 * (standalone Express server).
 *
 * It also fixes a long-standing bug: previously the WebSocket listeners were
 * bound to the concrete client instance. Whenever the user connected to
 * another MPD host, the client was replaced and every status push silently
 * died. Here the transport layer subscribes to the *service* instead, so it
 * survives client swaps.
 */

import { EventEmitter } from 'events';
import { MpdBridgeClient, MpdServerStatus } from './mpdBridge.ts';

export interface MpdTarget {
  host: string;
  port: number;
}

export class MpdService extends EventEmitter {
  private client: MpdBridgeClient;
  private host: string;
  private port: number;
  private password?: string;

  constructor(host = 'localhost', port = 6600, password?: string) {
    super();
    this.host = host;
    this.port = port;
    this.password = password;
    this.client = this.createClient(host, port, password);
  }

  /**
   * Creates a client and re-bridges its events onto the service so that
   * consumers never need to know about client instances.
   */
  private createClient(host: string, port: number, password?: string): MpdBridgeClient {
    const client = new MpdBridgeClient(host, port, password);

    client.on('status', (status: MpdServerStatus) => {
      this.emit('status', status);
    });
    client.on('connected', () => {
      this.emit('bridge_status', true);
    });
    client.on('disconnected', () => {
      this.emit('bridge_status', false);
    });

    return client;
  }

  public getClient(): MpdBridgeClient {
    return this.client;
  }

  public isConnected(): boolean {
    return this.client.getConnected();
  }

  public getTarget(): MpdTarget {
    return { host: this.host, port: this.port };
  }

  /**
   * Connects (or reconnects) to an MPD server. When the target changes, a
   * brand new client is created; otherwise the existing one is reused so
   * that a reconnect does not lose the polling loop bookkeeping.
   */
  public async connect(host?: string, port?: number, password?: string): Promise<boolean> {
    const nextHost = host || this.host;
    const nextPort = port || this.port;
    const nextPassword = password === undefined ? this.password : password;

    const targetChanged =
      nextHost !== this.host || nextPort !== this.port || nextPassword !== this.password;

    if (targetChanged) {
      this.client.disconnect();
      this.host = nextHost;
      this.port = nextPort;
      this.password = nextPassword;
      this.client = this.createClient(nextHost, nextPort, nextPassword);
      // Tell the clients that the old connection is gone before we try the
      // new one, so the UI never shows a stale "connected" badge.
      this.emit('bridge_status', false);
    }

    const connected = await this.client.connect();
    this.emit('bridge_status', connected);
    return connected;
  }

  public disconnect(): void {
    this.client.disconnect();
    this.emit('bridge_status', false);
  }
}
