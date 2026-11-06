/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Hubungkan ke host yang sama (port 3000)
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io Client] Terhubung ke server backend');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io Client] Terputus dari server backend');
    });
  }

  return socket;
}
