import express from 'express';
import cors from 'cors';
import authHandler from './auth.js';
import adminHandler from './admin.js';
import aiHandler from './ai.js';
import webhookHandler from './webhooks.js';

const app = express();

// CORS — allow all frontend domains + preview deployments
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// Mount route handlers
app.use('/api/auth', authHandler);
app.use('/api/admin', adminHandler);
app.use('/api/ai', aiHandler);
app.use('/api/webhooks', webhookHandler);

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

// Catch-all: redirect to frontend via HTML meta refresh (preserves path + query)
// NOTE: Express 5 removed '*' wildcard — use /{*splat} instead
app.get('/{*splat}', (req, res) => {
  const path = '/' + (req.params.splat || '');
  if (path.startsWith('/api/') || path === '/health' || path === '/') {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'https://jobrobotsaii-qbjo.vercel.app';
  const queryString = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  const targetUrl = `${frontendUrl}${path}${queryString}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${targetUrl}"><title>Redirecting...</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0f;color:#fff;}</style></head><body><p>Redirecting... <a href="${targetUrl}">Click here if not redirected</a>.</p></body></html>`);
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
