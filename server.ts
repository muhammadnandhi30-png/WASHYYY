/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { initUDPListener } from './server/udpListener.js';
import { scaleDetector } from './server/scaleDetector.js';
import { createApiRouter } from './server/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.io dengan CORS terbuka untuk development & iFrame
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  // Sambungkan Socket.io ke ScaleDetector
  scaleDetector.setSocketIO(io);

  // Middleware dasar
  app.use(cors());
  app.use(express.json());

  // Inisialisasi UDP listener untuk komunikasi ESP32
  initUDPListener();

  // Socket.io Connection Handler
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client web terhubung: ${socket.id}`);

    // Segera kirim status timbangan terkini ke client yang baru terkoneksi
    socket.emit('scale:status', scaleDetector.getStatus());

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // REST API Routes
  app.use('/api', createApiRouter(io));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      scale: scaleDetector.getStatus(),
    });
  });

  // Integrasi Vite Frontend
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode produksi: Sajikan file statis dari direktori dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` SMART LAUNDRY IOT MANAGEMENT SYSTEM`);
    console.log(` Web Server & Socket.io : http://localhost:${PORT}`);
    console.log(` UDP Listener (ESP32)   : Port ${process.env.UDP_PORT || 4210}`);
    console.log(` Mode                   : ${isProduction ? 'PRODUKSI' : 'DEVELOPMENT'}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Gagal menjalankan server:', err);
  process.exit(1);
});
