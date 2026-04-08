import jwt from 'jsonwebtoken';
import Application from './models/Application.js';
import connectDB from './_lib/db.js';

const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

const getAction = (req) => {
  const url = req.url.split('?')[0];
  // Remove leading slash then check: empty → list/create, has content → specific action
  const path = url.replace(/^\//, '');
  if (!path) return null;           // /applications → list/create
  if (path === 'applications') return null;  // also treat /applications (no slash) as list/create
  return path;                      // /applications/search → 'search', /applications/:id → ':id'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send('');
  }

  res.set(corsHeaders);

  const action = getAction(req);
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    // GET /api/applications — list all for user
    if ((action === '' || action === null) && method === 'GET') {
      const decoded = await authMiddleware(req);
      const { status, page = 1, limit = 50 } = req.query || {};
      const filter = { userId: decoded.id };
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [applications, total] = await Promise.all([
        Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Application.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: { applications, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      });
    }

    // POST /api/applications — create
    if ((action === '' || action === null) && method === 'POST') {
      const decoded = await authMiddleware(req);
      const { company, role, location, status, appliedDate, source, url, salary, notes, contactName, contactEmail } = body || {};

      if (!company || !role) {
        return res.status(400).json({ success: false, message: 'Company and role are required' });
      }

      const application = new Application({
        userId: decoded.id,
        company,
        role,
        location: location || '',
        status: status || 'saved',
        appliedDate: appliedDate && !isNaN(Date.parse(appliedDate)) ? new Date(appliedDate) : new Date(),
        source: source || '',
        url: url || '',
        salary: salary || '',
        notes: notes || '',
        contactName: contactName || '',
        contactEmail: contactEmail || '',
      });

      await application.save();

      return res.status(201).json({
        success: true,
        message: 'Application added',
        data: { application },
      });
    }

    // GET /api/applications/search?q=... — search user's applications
    if (action === 'search' && method === 'GET') {
      const decoded = await authMiddleware(req);
      const { q } = req.query || {};

      if (!q || q.trim().length < 1) {
        return res.status(200).json({ success: true, data: { applications: [], total: 0 } });
      }

      const searchRegex = new RegExp(q.trim(), 'i');
      const applications = await Application.find({
        userId: decoded.id,
        $or: [
          { role: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { notes: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.status(200).json({
        success: true,
        data: { applications, total: applications.length },
      });
    }

    // GET /api/applications/:id — get single
    if (action && method === 'GET') {
      const decoded = await authMiddleware(req);
      const application = await Application.findOne({ _id: action, userId: decoded.id });
      if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
      return res.status(200).json({ success: true, data: { application } });
    }

    // PUT /api/applications/:id — update
    if (action && method === 'PUT') {
      const decoded = await authMiddleware(req);
      const application = await Application.findOne({ _id: action, userId: decoded.id });
      if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

      const allowed = ['company', 'role', 'location', 'status', 'appliedDate', 'source', 'url', 'salary', 'notes', 'contactName', 'contactEmail'];
      allowed.forEach(field => {
        if (body[field] !== undefined) application[field] = body[field];
      });

      await application.save();
      return res.status(200).json({ success: true, message: 'Application updated', data: { application } });
    }

    // DELETE /api/applications/:id — delete
    if (action && method === 'DELETE') {
      const decoded = await authMiddleware(req);
      const application = await Application.findOneAndDelete({ _id: action, userId: decoded.id });
      if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
      return res.status(200).json({ success: true, message: 'Application deleted' });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Applications error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
