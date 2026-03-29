import authHandler from './auth/[action].js';
import adminHandler from './admin/[...action].js';
import aiHandler from './ai/[action].js';
import webhookHandler from './webhooks/[action].js';

// CORS headers - allow all origins for API
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

export default async function handler(req, res) {
  const { url, method } = req;
  const pathname = url.split('?')[0];

  // Handle CORS preflight for ALL routes
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  setCorsHeaders(res);

  try {
    // Health check
    if (pathname === '/' || pathname === '/api' || pathname === '/health') {
      return res.status(200).json({
        success: true,
        message: 'JobRobots AI API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Auth routes: /api/auth/login, /api/auth/register, etc.
    if (pathname.startsWith('/api/auth/')) {
      const action = pathname.split('/api/auth/')[1];
      req.query = { action };
      return authHandler(req, res);
    }

    // Admin routes: /api/admin/login, /api/admin/users, etc.
    if (pathname.startsWith('/api/admin/')) {
      const action = pathname.split('/api/admin/')[1];
      req.query = { action };
      return adminHandler(req, res);
    }

    // AI routes: /api/ai/answer, /api/ai/status, etc.
    if (pathname.startsWith('/api/ai/')) {
      const action = pathname.split('/api/ai/')[1];
      req.query = { action };
      return aiHandler(req, res);
    }

    // Webhook routes: /api/webhooks/ipn, /api/webhooks/health, etc.
    if (pathname.startsWith('/api/webhooks/')) {
      const action = pathname.split('/api/webhooks/')[1];
      req.query = { action };
      return webhookHandler(req, res);
    }

    // 404 for unknown routes
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
