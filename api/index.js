import authHandler from './auth/[action].js';
import adminHandler from './admin/[...action].js';
import aiHandler from './ai/[action].js';
import webhookHandler from './webhooks/[action].js';

// CORS headers for all responses
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

export default async function handler(req, res) {
  const { url, method } = req;
  const pathname = url.split('?')[0];

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  setCorsHeaders(res);

  // Auth routes: /auth/login, /auth/register
  if (pathname.startsWith('/auth/')) {
    const action = pathname.split('/auth/')[1];
    req.query = { action };
    return authHandler(req, res);
  }

  // Admin routes: /admin/login, /admin/users
  if (pathname.startsWith('/admin/')) {
    const action = pathname.split('/admin/')[1];
    req.query = { action };
    return adminHandler(req, res);
  }

  // AI routes: /ai/answer, /ai/status
  if (pathname.startsWith('/ai/')) {
    const action = pathname.split('/ai/')[1];
    req.query = { action };
    return aiHandler(req, res);
  }

  // Webhook routes: /webhooks/ipn, /webhooks/health
  if (pathname.startsWith('/webhooks/')) {
    const action = pathname.split('/webhooks/')[1];
    req.query = { action };
    return webhookHandler(req, res);
  }

  // Health check
  if (pathname === '/' || pathname === '/health') {
    return res.status(200).json({
      success: true,
      message: 'JobRobots AI API is running',
      timestamp: new Date().toISOString()
    });
  }

  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
}
