import authHandler from './auth/[action].js';
import adminHandler from './admin/[...action].js';
import aiHandler from './ai/[action].js';
import webhookHandler from './webhooks/[action].js';

// CORS headers on every response
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  let pathname = url.split('?')[0];

  // Strip the /api prefix — vercel.json already routed /api/* here
  if (pathname.startsWith('/api')) {
    pathname = pathname.slice(4) || '/';
  }

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
      const action = pathname.split('/auth/')[1];
      req.query = { action };
      return authHandler(req, res);
    }

    // Admin routes: /admin/login, /admin/users, etc.
    if (pathname.startsWith('/admin/')) {
      const action = pathname.split('/admin/')[1];
      req.query = { action };
      return adminHandler(req, res);
    }

    // AI routes: /ai/answer, /ai/status, etc.
    if (pathname.startsWith('/ai/')) {
      const action = pathname.split('/ai/')[1];
      req.query = { action };
      return aiHandler(req, res);
    }

    // Webhook routes: /webhooks/ipn, etc.
    if (pathname.startsWith('/webhooks/')) {
      const action = pathname.split('/webhooks/')[1];
      req.query = { action };
      return webhookHandler(req, res);
    }

    // Unknown route
    return res.status(404).json({
      success: false,
      message: `Route ${pathname} not found`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
