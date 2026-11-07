/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import { createApiRouter } from '../server/routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Dummy Socket.IO emitter untuk lingkungan Serverless Vercel
const dummyIo: any = {
  emit: () => {},
  on: () => {},
};

// Pasang routes API
app.use('/api', createApiRouter(dummyIo));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', environment: 'Vercel Serverless', timestamp: new Date().toISOString() });
});

export default app;

