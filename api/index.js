// Flat imports — Vercel can bundle these ✅
import authHandler from './auth.js';
import adminHandler from './admin.js';
import aiHandler from './ai.js';
import webhookHandler from './webhooks.js';

// CORS with specific allowed origins
const setCorsHeaders = (req, res) => {
  const allowedOrigins = [
    'https://jobrobotsaii-qbjo.vercel.app',
    'https://jobrobotsaii-6jrn.vercel.app',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  const { url, method } = req;
  let pathname = url.split('?')[0];

  // Strip /api prefix (vercel routes /api/* → here)
  if (pathname.startsWith('/api')) {
    pathname = pathname.replace('/api', '') || '/';
  }

  // Handle preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(200).end();
  }

  // Apply CORS
  setCorsHeaders(req, res);

  try {
    // Health check
    if (pathname === '/' || pathname === '/health') {
      return res.status(200).json({
        success: true,
        message: 'JobRobots AI API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Auth routes: /auth/login, /auth/register, etc.
    if (pathname.startsWith('/auth/')) {
      req.query = { action: pathname.split('/auth/')[1] };
      return await authHandler(req, res);
    }

    // Admin routes: /admin/login, /admin/users, etc.
    if (pathname.startsWith('/admin/')) {
      req.query = { action: pathname.split('/admin/')[1] };
      return await adminHandler(req, res);
    }

    // AI routes: /ai/answer, /ai/status, etc.
    if (pathname.startsWith('/ai/')) {
      req.query = { action: pathname.split('/ai/')[1] };
      return await aiHandler(req, res);
    }

    // Webhook routes: /webhooks/ipn, etc.
    if (pathname.startsWith('/webhooks/')) {
      req.query = { action: pathname.split('/webhooks/')[1] };
      return await webhookHandler(req, res);
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
