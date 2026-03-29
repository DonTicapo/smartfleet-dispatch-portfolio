import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { getConfig } from '../../config.js';
import type { LoadTrackerService } from '../../application/services/load-tracker-service.js';

interface Principal {
  sub: string;
  role: string;
  customerId: string;
}

export function registerLoadTrackingWs(
  app: FastifyInstance,
  loadTrackerService: LoadTrackerService,
): void {
  app.get('/ws/loads/:loadId', { websocket: true }, (socket, request) => {
    const { loadId } = request.params as { loadId: string };

    // Authenticate via query param token
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      socket.send(JSON.stringify({ error: 'Missing token' }));
      socket.close(4001, 'Unauthorized');
      return;
    }

    let principal: Principal;
    try {
      const config = getConfig();
      principal = jwt.verify(token, config.JWT_SECRET) as Principal;
    } catch {
      socket.send(JSON.stringify({ error: 'Invalid token' }));
      socket.close(4001, 'Unauthorized');
      return;
    }

    const customerId = principal.customerId;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const sendUpdate = async () => {
      try {
        const data = await loadTrackerService.getEta(loadId, customerId);
        socket.send(JSON.stringify({ type: 'load_update', data }));

        // Stop sending if load is completed
        if (data.status === 'COMPLETED' && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
          socket.send(JSON.stringify({ type: 'tracking_complete' }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        socket.send(JSON.stringify({ type: 'error', message }));
      }
    };

    // Send initial update immediately
    sendUpdate();

    // Then push updates every 5 seconds (much faster than the old 15s polling)
    intervalId = setInterval(sendUpdate, 5000);

    socket.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });
  });
}
