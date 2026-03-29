import jwt from 'jsonwebtoken';
import connectDB from '../db.js';
import User from '../../backend/models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

const checkCredits = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.status !== 'active') throw new Error('Account is not active');
  if (user.aiCredits <= 0) throw new Error('No AI credits remaining');
  return user;
};

const useCredit = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { aiCredits: -1 } });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (dbError) {
    console.error('DB Error:', dbError.message);
    return res.status(dbError.statusCode || 500).json({
      success: false,
      message: dbError.message || 'Database unavailable'
    });
  }

  const { method, query, body } = req;
  const action = query.action;

  try {
    // Answer Generator
    if (action === 'answer' && method === 'POST') {
      const decoded = await authMiddleware(req);
      const user = await checkCredits(decoded.id);
      const { question, role, tone, length } = body;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an AI assistant helping a ${role || 'professional'} prepare for job interviews.

Question: ${question}

Generate a ${tone || 'professional'} answer that is ${length || 'medium'} in length.

Provide a clear, concise response that addresses the question effectively.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await useCredit(decoded.id);

      return res.status(200).json({
        success: true,
        data: { answer: text, creditsRemaining: user.aiCredits - 1 }
      });
    }

    // Status Check
    if (action === 'status' && method === 'GET') {
      const decoded = await authMiddleware(req);
      const user = await User.findById(decoded.id);

      return res.status(200).json({
        success: true,
        data: {
          credits: user.aiCredits,
          plan: user.plan,
          resumesRemaining: user.plan === 'free' ? 1 : 999
        }
      });
    }

    // Cover Letter
    if (action === 'cover-letter' && method === 'POST') {
      const decoded = await authMiddleware(req);
      const user = await checkCredits(decoded.id);
      const { company, role, jobDescription, experience } = body;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Write a professional cover letter for the following:

Company: ${company}
Role: ${role}
Job Description: ${jobDescription}
Your Experience: ${experience}

Make it compelling and tailored to the role.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await useCredit(decoded.id);
      await User.findByIdAndUpdate(decoded.id, { $inc: { resumeGenerations: 1 } });

      return res.status(200).json({
        success: true,
        data: { coverLetter: text, creditsRemaining: user.aiCredits - 1 }
      });
    }

    // Outreach
    if (action === 'outreach' && method === 'POST') {
      const decoded = await authMiddleware(req);
      const user = await checkCredits(decoded.id);
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Write a ${type || 'professional'} message to:

Recipient: ${recipientName || 'Hiring Manager'}
Role: ${recipientRole || 'at the company'}
Company: ${company}

Your Background: ${yourBackground}
Target Role: ${targetRole}

Keep it concise, professional, and engaging.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await useCredit(decoded.id);

      return res.status(200).json({
        success: true,
        data: { message: text, creditsRemaining: user.aiCredits - 1 }
      });
    }

    res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('AI API Error:', error);

    if (error.message.includes('Access denied') || error.message.includes('token')) {
      return res.status(401).json({ success: false, message: error.message });
    }

    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
}
