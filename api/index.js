// Flat imports — Vercel can bundle these ✅
import authHandler from './auth.js';
import adminHandler from './admin.js';
import aiHandler from './ai.js';
import webhookHandler from './webhooks.js';

const ALLOWED_ORIGINS = [
  'https://jobrobotsaii-qbjo.vercel.app',
  'https://jobrobotsaii-6jrn.vercel.app',
];

const setCorsHeaders = (req, res) => {
  const origin = req.headers?.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Extract action from pathname (handles both /api/admin/login and /admin/login)
const getAction = (pathname) => {
  const segments = pathname.split('/').filter(Boolean); // ['api', 'admin', 'login']
  // Skip 'api' prefix if present, return next segment
  const startIndex = segments[0] === 'api' ? 1 : 0;
  return segments[startIndex + 1] || null; // ['admin', 'login'] → 'login'
};

export default async function handler(req, res) {
  const { url, method } = req;
  const pathname = url.split('?')[0];
  const route = req.query?.route || '';

  // Handle preflight FIRST
  if (method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(200).end();
  }

  setCorsHeaders(req, res);

  try {
    // Health check
    if (route === 'health' || pathname === '/' || pathname === '/health') {
      return res.status(200).json({
        success: true,
        message: 'JobRobots AI API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Auth routes
    if (route === 'auth' || pathname.startsWith('/auth/')) {
      req.query = { action: getAction(pathname) };
      return await authHandler(req, res);
    }

    // Admin routes
    if (route === 'admin' || pathname.startsWith('/admin/')) {
      req.query = { action: getAction(pathname) };
      return await adminHandler(req, res);
    }

    // AI routes
    if (route === 'ai' || pathname.startsWith('/ai/')) {
      req.query = { action: getAction(pathname) };
      return await aiHandler(req, res);
    }

    // Webhook routes
    if (route === 'webhooks' || pathname.startsWith('/webhooks/')) {
      req.query = { action: getAction(pathname) };
      return await webhookHandler(req, res);
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
