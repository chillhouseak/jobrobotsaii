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

// Redirect all non-API routes to frontend (preserve path + query string)
const frontendUrl = process.env.FRONTEND_URL || 'https://jobrobotsaii-qbjo.vercel.app';
app.get('*', (req, res) => {
  // Skip API routes (already handled above)
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  // Redirect to frontend preserving path and query string
  const redirectUrl = `${frontendUrl}${req.path}${req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''}`;
  res.redirect(302, redirectUrl);
});

// 404 fallback (for edge cases)
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
