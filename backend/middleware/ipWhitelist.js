const IP_WHITELIST = process.env.IPN_WHITELIST
  ? process.env.IPN_WHITELIST.split(',').map(ip => ip.trim())
  : ['65.108.6.37']; // Default LaunchpadJV IP

// Allowed IPs for webhooks
const ALLOWED_IPS = new Set(IP_WHITELIST);

// Logging utility
const logIPNRequest = (req, isAllowed, reason = null) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const action = req.body?.action || 'Unknown';

  const logEntry = {
    timestamp,
    ip,
    userAgent,
    action,
    isAllowed,
    reason,
    endpoint: req.originalUrl,
    method: req.method
  };

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[IPN Webhook] ${isAllowed ? '✅ ALLOWED' : '❌ BLOCKED'}: ${JSON.stringify(logEntry)}`);
  }

  return logEntry;
};

// Main IP whitelist middleware
const ipWhitelistMiddleware = (req, res, next) => {
  const clientIP = getClientIP(req);

  // Check if IP is in whitelist
  if (ALLOWED_IPS.has(clientIP)) {
    logIPNRequest(req, true);
    return next();
  }

  // Log blocked request
  logIPNRequest(req, false, 'IP not in whitelist');

  return res.status(403).json({
    success: false,
    error: 'Access denied',
    message: 'Your IP address is not authorized to access this endpoint'
  });
};

// Extract real client IP (handles proxies)
const getClientIP = (req) => {
  // Check common proxy headers
  const forwardedFor = req.get('X-Forwarded-For');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }

  // Fall back to direct connection IP
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
};

// Dynamic IP whitelist manager (for runtime updates)
class IPWhitelistManager {
  constructor() {
    this.allowedIPs = new Set(IP_WHITELIST);
  }

  addIP(ip) {
    this.allowedIPs.add(ip);
    console.log(`[IPN] Added IP to whitelist: ${ip}`);
  }

  removeIP(ip) {
    this.allowedIPs.delete(ip);
    console.log(`[IPN] Removed IP from whitelist: ${ip}`);
  }

  isAllowed(ip) {
    return this.allowedIPs.has(ip);
  }

  getAllowedIPs() {
    return Array.from(this.allowedIPs);
  }

  // Reload from environment
  reload() {
    const envIPs = process.env.IPN_WHITELIST
      ? process.env.IPN_WHITELIST.split(',').map(ip => ip.trim())
      : ['65.108.6.37'];

    this.allowedIPs = new Set(envIPs);
    console.log('[IPN] Reloaded IP whitelist:', this.getAllowedIPs());
  }
}

const ipWhitelistManager = new IPWhitelistManager();

module.exports = {
  ipWhitelistMiddleware,
  ipWhitelistManager,
  getClientIP,
  logIPNRequest
};
