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
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
      throw new Error('GEMINI_QUOTA_EXCEEDED');
    }
    throw err;
  }
};

const getAction = (req) => {
  const url = req.url.split('?')[0];
  return url.replace(/^\//, '') || null;
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
    // ============================================================
    // PUBLIC ROUTES — no authentication required
    // ============================================================

    // Image Generation (Pollinations — free, no auth)
    if (action === 'generate-image' && method === 'POST') {
      const { prompt, width = 1024, height = 1024, seed, style } = body || {};

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      const encodedPrompt = encodeURIComponent(prompt.trim());
      const styleParam = style && style !== 'none' ? `&model=${style}` : '';
      const seedParam = seed ? `&seed=${seed}` : '';
      const nologo = '&nologo=true';

      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}${seedParam}${styleParam}${nologo}`;

      return res.status(200).json({
        success: true,
        data: {
          imageUrl,
          prompt: prompt.trim(),
          width,
          height,
          seed: seed || Math.floor(Math.random() * 999999999),
        }
      });
    }

    // Goal Tracker — free AI feature, no auth
    if ((action === 'goal-tracker' || action === 'generate-goal') && method === 'POST') {
      const { goal, role, timeframe, obstacles } = body || {};

      if (!goal) {
        return res.status(400).json({ success: false, message: 'Goal is required' });
      }

      try {
        const prompt = `You are an AI career advisor helping a ${role || 'professional'} create an actionable goal plan.\n\nGoal: ${goal}\nTimeframe: ${timeframe || '3 months'}\nPotential Obstacles: ${obstacles || 'Limited time, resource constraints'}\n\nCreate a detailed, actionable plan with milestones, weekly tasks, and success metrics. Be specific and practical.`;
        const result = await callGemini(prompt);
        return res.status(200).json({ success: true, data: { result, usingAI: true } });
      } catch (err) {
        if (err.message === 'GEMINI_QUOTA_EXCEEDED') {
          return res.status(429).json({ success: false, message: 'Gemini API quota exceeded. Please try again later.', quotaExceeded: true });
        }
        if (err.message === 'GEMINI_API_KEY not configured') {
          return res.status(503).json({ success: false, message: 'AI service not configured' });
        }
        throw err;
      }
    }

    // Resume Tailor — free AI feature, no auth
    if (action === 'tailor-resume' && method === 'POST') {
      const { resume, jobDescription, targetRole } = body || {};

      if (!resume || !jobDescription) {
        return res.status(400).json({ success: false, message: 'Resume and job description are required' });
      }

      try {
        const prompt = `You are a professional resume writer. Tailor the following resume for the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nTarget Role: ${targetRole || 'the role above'}\n\nRewrite the resume to highlight the most relevant skills and experience. Keep it concise (max 2 pages). Use action verbs and quantify achievements where possible. Return the tailored resume in clean markdown format.`;
        const tailoredResume = await callGemini(prompt);
        return res.status(200).json({ success: true, data: { tailoredResume, usingAI: true } });
      } catch (err) {
        if (err.message === 'GEMINI_QUOTA_EXCEEDED') {
          return res.status(429).json({ success: false, message: 'Gemini API quota exceeded. Please try again later.', quotaExceeded: true });
        }
        if (err.message === 'GEMINI_API_KEY not configured') {
          return res.status(503).json({ success: false, message: 'AI service not configured' });
        }
        throw err;
      }
    }

    // ============================================================
    // PROTECTED ROUTES — authentication required
    // ============================================================
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });

    // Answer Generator
    if (action === 'answer' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { question, role, tone, length } = body || {};
      try {
        const prompt = `You are an AI assistant helping a ${role || 'professional'} prepare for job interviews.\n\nQuestion: ${question}\n\nGenerate a ${tone || 'professional'} answer that is ${length || 'medium'} in length.\n\nProvide a clear, concise response that addresses the question effectively.`;
        const answer = await callGemini(prompt);
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
        return res.status(200).json({ success: true, data: { answer, creditsRemaining: user.aiCredits - 1 } });
      } catch (err) {
        if (err.message === 'GEMINI_QUOTA_EXCEEDED') {
          return res.status(429).json({ success: false, message: 'Gemini API quota exceeded. Please try again later.', quotaExceeded: true });
        }
        throw err;
      }
    }

    // Status
    if (action === 'status' && method === 'GET') {
      return res.status(200).json({ success: true, data: { credits: user.aiCredits, plan: user.plan, resumesRemaining: user.plan === 'free' ? 1 : 999 } });
    }

    // Cover Letter
    if (action === 'cover-letter' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { company, role, jobDescription, experience } = body || {};
      try {
        const prompt = `Write a professional cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription}\nYour Experience: ${experience}\n\nMake it compelling and tailored to the role.`;
        const coverLetter = await callGemini(prompt);
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 }, $inc: { resumeGenerations: 1 } });
        return res.status(200).json({ success: true, data: { coverLetter, creditsRemaining: user.aiCredits - 1 } });
      } catch (err) {
        if (err.message === 'GEMINI_QUOTA_EXCEEDED') {
          return res.status(429).json({ success: false, message: 'Gemini API quota exceeded. Please try again later.', quotaExceeded: true });
        }
        throw err;
      }
    }

    // Outreach
    if (action === 'outreach' && method === 'POST') {
      if (user.aiCredits <= 0) return res.status(403).json({ success: false, message: 'No AI credits remaining' });
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body || {};
      try {
        const prompt = `Write a ${type || 'professional'} message.\n\nRecipient: ${recipientName || 'Hiring Manager'}\nRole: ${recipientRole || ''}\nCompany: ${company}\nYour Background: ${yourBackground}\nTarget Role: ${targetRole}\n\nKeep it concise and engaging.`;
        const message = await callGemini(prompt);
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
        return res.status(200).json({ success: true, data: { message, creditsRemaining: user.aiCredits - 1 } });
      } catch (err) {
        if (err.message === 'GEMINI_QUOTA_EXCEEDED') {
          return res.status(429).json({ success: false, message: 'Gemini API quota exceeded. Please try again later.', quotaExceeded: true });
        }
        throw err;
      }
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('AI error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.message?.includes('Access denied')) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
