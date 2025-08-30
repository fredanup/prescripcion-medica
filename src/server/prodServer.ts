import next from 'next';
import { createServer } from 'node:http';
import { parse } from 'node:url';
import type { Socket } from 'net';

import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';

import { createContext } from './context';
import { appRouter } from './routers/_app';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    if (!req.url) return;
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });
  
  const wss = new WebSocketServer({ 
    server,
    // Configuraciones adicionales para evitar problemas de conexión
    perMessageDeflate: false,
    maxPayload: 64 * 1024, // 64KB
  });
  
  const handler = applyWSSHandler({ 
    wss, 
    router: appRouter, 
    createContext,
    // Configuración para manejar errores de conexión
    onError: ({ error, type, path }) => {
      console.error(`❌ tRPC WebSocket error in ${type} at ${path}:`, error);
      
      if (error.code === 'UNAUTHORIZED') {
        console.log('WebSocket unauthorized - closing connection');
        return;
      }
    },
  });

  // Manejar conexiones WebSocket
  wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`);
    
    // Configurar timeout para connections inactivas
    const timeout = setTimeout(() => {
      console.log('⏰ WebSocket timeout - closing connection');
      ws.terminate();
    }, 60000); // 60 segundos

    ws.on('message', () => {
      // Reset timeout en cada mensaje
      clearTimeout(timeout);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      console.log(`➖➖ Connection (${wss.clients.size}) - Code: ${code}, Reason: ${reason.toString()}`);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('WebSocket error:', error);
    });
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received - broadcasting reconnect notification');
    handler.broadcastReconnectNotification();
    
    // Cerrar todas las conexiones WebSocket
    wss.clients.forEach((ws) => {
      ws.terminate();
    });
    
    wss.close(() => {
      console.log('WebSocket server closed');
    });
  });

  server.on('upgrade', (req, socket, head) => {
    // Verificar que la URL sea para WebSocket
    if (req.url?.includes('/api/trpc')) {
      socket.destroy();
      return;
    }
    
    wss.handleUpgrade(req, socket as Socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // Prevenir que Next.js maneje upgrades
  const originalOn = server.on.bind(server);
  server.on = function (event, listener) {
    return event !== 'upgrade' ? originalOn(event, listener) : server;
  };

  server.listen(port, () => {
    console.log(
      `🚀 Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`,
    );
    console.log(`🔌 WebSocket server ready`);
  });
});