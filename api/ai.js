import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Access denied. No token.');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState) return;
  await mongoose.connect(uri, { bufferCommands: false });
};

export const setCors = (req, res) => {
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

const callGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query || {};
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });

    // Answer Generator
    if (action === 'answer' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { question, role, tone, length } = body || {};
      const prompt = `You are an AI assistant helping a ${role || 'professional'} prepare for job interviews.\n\nQuestion: ${question}\n\nGenerate a ${tone || 'professional'} answer that is ${length || 'medium'} in length.\n\nProvide a clear, concise response that addresses the question effectively.`;
      const answer = await callGemini(prompt);
      await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      return res.status(200).json({ success: true, data: { answer, creditsRemaining: user.aiCredits - 1 } });
    }

    // Status
    if (action === 'status' && method === 'GET') {
      return res.status(200).json({ success: true, data: { credits: user.aiCredits, plan: user.plan, resumesRemaining: user.plan === 'free' ? 1 : 999 } });
    }

    // Cover Letter
    if (action === 'cover-letter' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { company, role, jobDescription, experience } = body || {};
      const prompt = `Write a professional cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription}\nYour Experience: ${experience}\n\nMake it compelling and tailored to the role.`;
      const coverLetter = await callGemini(prompt);
      await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 }, $inc: { resumeGenerations: 1 } });
      return res.status(200).json({ success: true, data: { coverLetter, creditsRemaining: user.aiCredits - 1 } });
    }

    // Outreach
    if (action === 'outreach' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body || {};
      const prompt = `Write a ${type || 'professional'} message.\n\nRecipient: ${recipientName || 'Hiring Manager'}\nRole: ${recipientRole || ''}\nCompany: ${company}\nYour Background: ${yourBackground}\nTarget Role: ${targetRole}\n\nKeep it concise and engaging.`;
      const message = await callGemini(prompt);
      await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      return res.status(200).json({ success: true, data: { message, creditsRemaining: user.aiCredits - 1 } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('AI error:', error);
    if (error.message.includes('Access denied') || error.message.includes('token')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
