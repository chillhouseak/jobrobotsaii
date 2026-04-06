import express from 'express';
import cors from 'cors';
import authHandler from './auth.js';
import adminHandler from './admin.js';
import aiHandler from './ai.js';
import webhookHandler from './webhooks.js';
import applicationsHandler from './applications.js';
import jobsHandler from './jobs.js';
import searchHandler from './search.js';

const app = express();

// CORS — allow all frontend domains + preview deployments
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies — limit to 4.5MB (Vercel serverless max)
app.use(express.json({ limit: '4.5mb' }));

// Mount route handlers
app.use('/api/auth', authHandler);
app.use('/api/admin', adminHandler);
app.use('/api/ai', aiHandler);
app.use('/api/webhooks', webhookHandler);
app.use('/api/applications', applicationsHandler);
app.use('/api/jobs', jobsHandler);
app.use('/api/search', searchHandler);

// Health check routes
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'JobRobots AI API is running' });
});

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'JobRobots AI API is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'JobRobots AI API is running' });
});

// Catch-all: return 404 for any non-API routes that somehow hit the backend
// NOTE: Express 5 removed '*' wildcard — use /{*splat} instead
app.get('/{*splat}', (req, res) => {
  const path = '/' + (req.params.splat || '');
  res.status(404).json({
    success: false,
    message: 'Route not found',
    hint: 'This is an API server. For the frontend, go to https://jobrobotsaii-qbjo.vercel.app'
  });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
