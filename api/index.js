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

// Extract route group (auth|admin|ai|webhooks) and action from pathname
// Handles both /api/admin/login and /admin/login
const parseRoute = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  let startIndex = 0;

  // Skip /api prefix if present
  if (segments[0] === 'api') startIndex = 1;

  const routeGroup = segments[startIndex] || null; // 'admin', 'auth', etc.
  const action = segments[startIndex + 1] || null; // 'login', 'users', etc.

  return { routeGroup, action };
};

export default async function handler(req, res) {
  const { url, method } = req;
  const pathname = url.split('?')[0];

  // Handle preflight FIRST
  if (method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(200).end();
  }

  setCorsHeaders(req, res);

  const { routeGroup, action } = parseRoute(pathname);

  try {
    // Health check
    if (routeGroup === null || routeGroup === 'health' || pathname === '/') {
      return res.status(200).json({
        success: true,
        message: 'JobRobots AI API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Auth routes
    if (routeGroup === 'auth') {
      req.query = { action: action || 'login' };
      return await authHandler(req, res);
    }

    // Admin routes
    if (routeGroup === 'admin') {
      req.query = { action: action || 'login' };
      return await adminHandler(req, res);
    }

    // AI routes
    if (routeGroup === 'ai') {
      req.query = { action: action || 'status' };
      return await aiHandler(req, res);
    }

    // Webhook routes
    if (routeGroup === 'webhooks') {
      req.query = { action: action || 'health' };
      return await webhookHandler(req, res);
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
