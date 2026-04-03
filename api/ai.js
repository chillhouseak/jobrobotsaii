import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

// ================================================================
// AI PROVIDER CONFIGURATION
// ================================================================
// Priority: Groq (fastest, generous free tier) → HuggingFace → Mock
//
// Get free API keys:
// - Groq:      https://console.groq.com/keys
// - HuggingFace: https://huggingface.co/settings/inference

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ================================================================
// PROVIDER IMPLEMENTATIONS
// ================================================================

// --- Groq (Primary) ---
// Free tier: llama-3.1-8b-instant → 14,400 req/day, 30,000 tokens/min
const callGroq = async (prompt) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('GROQ_NOT_CONFIGURED');
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (res.status === 429) throw new Error('GROQ_RATE_LIMITED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
};

// --- HuggingFace (Secondary) ---
const callHuggingFace = async (prompt) => {
  const endpoint = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
  const headers = HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {};
  const body = { inputs: prompt, parameters: { max_new_tokens: 512, temperature: 0.7, return_full_text: false } };

  let res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error('HF_RATE_LIMITED');
  if (res.status === 503) {
    // Model cold-start: wait 2s and retry once
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HF_UNAVAILABLE');
  } else if (!res.ok) {
    throw new Error(`HF error ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
};

// --- Gemini (Tertiary) ---
const callGemini = async (prompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// --- Mock Responses (Last Resort) ---
const mockResponses = {
  answer: (role, tone, length) => {
    const tpls = {
      professional: "Thank you for the opportunity to discuss this position. With my background in this field, I have developed strong skills in problem-solving and collaboration. I am excited about the possibility of bringing this experience to your team and contributing to your company's success.",
      friendly: "Hey there! I'm really excited about this opportunity. I've been working in this space for a while now, and I've loved every bit of it. What really gets me going is solving tricky problems and working with awesome people.",
      confident: "I am the ideal candidate for this position. With proven expertise in this domain, I have consistently exceeded expectations and delivered measurable results throughout my career.",
      casual: "Honestly, this is right up my alley. I've tackled similar challenges before and I'm confident I can bring real value here.",
    };
    let t = tpls[tone] || tpls.professional;
    if (length === 'short') t = t.split('.')[0] + '.';
    if (length === 'long') t = t + ' ' + tpls[tone];
    return t;
  },
  coverLetter: (company, role, experience) =>
    `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${role} position at ${company}. With my background in ${experience || 'software development'} and passion for delivering exceptional results, I believe I would be a valuable addition to your team.\n\nThroughout my career, I have developed strong skills that align well with your requirements. I am particularly drawn to ${company} because of its innovative approach and commitment to excellence.\n\nI am excited about the possibility of contributing to your continued success and would welcome the opportunity to discuss how my skills and experience would benefit your organization.\n\nThank you for considering my application.\n\nSincerely`,
  outreach: (type, name, company, role) => {
    const tpls = {
      linkedin: `Hi ${name},\n\nI hope this message finds you well! I'm currently exploring opportunities in ${role || 'software development'} and came across your profile. Your experience is truly inspiring.\n\nI would love to connect and learn more about your journey.\n\nBest regards`,
      email: `Dear ${name},\n\nI hope this email finds you well. I am reaching out to express my interest in potential opportunities at ${company}.\n\nWith a background in ${role || 'software development'}, I am particularly drawn to organizations that value innovation.\n\nI would greatly appreciate the opportunity to connect.\n\nWarm regards`,
      referral: `Hi ${name},\n\nI hope you're doing well! I'm reaching out because I'm very interested in opportunities at ${company}.\n\nIf you know of anyone on your team who might be able to refer me, I would greatly appreciate it.\n\nThank you!`,
      followup: `Hi ${name},\n\nI wanted to follow up on my previous message regarding opportunities at ${company}.\n\nI remain very interested in contributing to your team.\n\nBest regards`,
    };
    return tpls[type] || tpls.linkedin;
  },
  goalTracker: (goal, timeframe) =>
    `# Action Plan: ${goal}\n\n**Timeframe:** ${timeframe || '3 months'}\n\n## Phase 1: Foundation (Weeks 1-2)\n- Research the target role and industry trends\n- Update resume and LinkedIn profile\n- Identify 5-10 companies that match your goals\n\n## Phase 2: Active Search (Weeks 3-6)\n- Apply to 3-5 positions per week\n- Network with professionals in the field\n- Practice interview questions daily\n\n## Phase 3: Interviews & Follow-up (Weeks 7-10)\n- Prepare for each interview with company research\n- Send thank-you notes within 24 hours\n- Follow up on pending applications\n\n## Phase 4: Decision (Weeks 11-12)\n- Evaluate offers carefully\n- Negotiate terms if applicable\n- Plan for a smooth transition\n\n## Weekly Targets\n1. Submit at least 3 quality applications\n2. Complete 2 networking outreach messages\n3. Practice 5+ interview questions\n4. Track all activities`,
  tailorResume: (jobDescription) =>
    `# Tailored Resume Summary\n\n**Key Match:** Your resume should highlight skills and experience that directly align with:\n${jobDescription}\n\n## ATS Keywords to Include\n- Review the job description for repeated terms\n- Include technical skills and tools mentioned\n- Use industry-standard keywords\n\n## Tailored Summary\nRewrite your professional summary to include:\n1. Years of relevant experience\n2. Key technical skills matching the role\n3. A measurable achievement or impact\n\n## Action Verbs to Use\nImplemented, Developed, Led, Optimized, Increased, Reduced, Streamlined, Architected\n\n*Tip: Tailor each resume for every application. Quality over quantity wins.*`,
};

// ================================================================
// UNIFIED AI CALL — tries providers in order
// ================================================================
const callAI = async (prompt, feature, context = {}) => {
  // 1. Try Groq
  if (GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      const result = await callGroq(prompt);
      return { text: result, provider: 'groq' };
    } catch (err) {
      if (err.message !== 'GROQ_RATE_LIMITED') console.warn('[AI] Groq failed:', err.message);
      else console.warn('[AI] Groq rate limited, trying next provider...');
    }
  }

  // 2. Try HuggingFace
  try {
    const result = await callHuggingFace(prompt);
    return { text: result, provider: 'huggingface' };
  } catch (err) {
    console.warn('[AI] HuggingFace failed:', err.message);
  }

  // 3. Try Gemini (if configured)
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const result = await callGemini(prompt);
      return { text: result, provider: 'gemini' };
    } catch (err) {
      console.warn('[AI] Gemini failed:', err.message);
    }
  }

  // 4. Fallback to mock
  console.log('[AI] All providers failed — using mock response');
  switch (feature) {
    case 'answer':
      return { text: mockResponses.answer(context.role, context.tone, context.length), provider: 'mock' };
    case 'coverLetter':
      return { text: mockResponses.coverLetter(context.company, context.role, context.experience), provider: 'mock' };
    case 'outreach':
      return { text: mockResponses.outreach(context.type, context.recipientName, context.company, context.targetRole), provider: 'mock' };
    case 'goalTracker':
      return { text: mockResponses.goalTracker(context.goal, context.timeframe), provider: 'mock' };
    case 'tailorResume':
      return { text: mockResponses.tailorResume(context.jobDescription), provider: 'mock' };
    default:
      return { text: 'AI service is temporarily unavailable. Please try again later.', provider: 'mock' };
  }
};

// ================================================================
// HELPERS
// ================================================================
const getAction = (url) => url.split('?')[0].replace(/^\//, '') || null;

const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw Object.assign(new Error('No token'), { name: 'AuthError' });
  return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ================================================================
// VERCEL HANDLER (NOT an Express app)
// ================================================================
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send('');
  }
  res.set(corsHeaders);

  const action = getAction(req.url);
  const { method, body } = req;

  // Goal Tracker
  if ((action === 'goal-tracker' || action === 'generate-goal') && method === 'POST') {
    try {
      await connectDB();
    } catch (e) {
      return res.status(503).json({ success: false, message: e.message });
    }
    const { goal, timeframe, obstacles } = body || {};
    if (!goal) return res.status(400).json({ success: false, message: 'Goal is required' });

    const prompt = `You are an expert career coach. Create a detailed, actionable plan for this goal.\n\nGoal: ${goal}\nTimeframe: ${timeframe || '3 months'}\nObstacles: ${obstacles || 'Limited time, resource constraints'}\n\nProvide a structured plan with phases, weekly tasks, daily actions, and success metrics.`;
    const { text, provider } = await callAI(prompt, 'goalTracker', { goal, timeframe });

    return res.status(200).json({ success: true, data: { result: text, provider } });
  }

  // Resume Tailor
  if (action === 'tailor-resume' && method === 'POST') {
    try {
      await connectDB();
    } catch (e) {
      return res.status(503).json({ success: false, message: e.message });
    }
    const { resume, jobDescription, targetRole } = body || {};
    if (!resume || !jobDescription) return res.status(400).json({ success: false, message: 'Resume and job description are required' });

    const prompt = `You are a professional resume writer. Tailor this resume for the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nTarget Role: ${targetRole || 'the role above'}\n\nRewrite the resume to highlight the most relevant skills. Keep it concise. Use action verbs and quantify achievements. Return in clean markdown.`;
    const { text, provider } = await callAI(prompt, 'tailorResume', { jobDescription });

    return res.status(200).json({ success: true, data: { tailoredResume: text, provider } });
  }

  // ============================================================
  // PROTECTED ROUTES — auth required below
  // ============================================================
  try {
    await connectDB();
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });

    // Status check
    if (action === 'status' && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          credits: user.aiCredits,
          plan: user.plan,
          provider: GROQ_API_KEY ? 'groq' : HF_API_KEY ? 'huggingface' : 'mock',
        },
      });
    }

    // Answer Generator
    if (action === 'answer' && method === 'POST') {
      const { question, role, tone, length } = body || {};
      if (!question) return res.status(400).json({ success: false, message: 'Question is required' });

      const prompt = `You are an expert interview coach. Answer the following interview question clearly and effectively.\n\nQuestion: ${question}\nRole: ${role || 'Professional'}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'}\n\nProvide a clear, concise answer.`;
      const { text, provider } = await callAI(prompt, 'answer', { role, tone, length });

      if (user.aiCredits > 0) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      }
      return res.status(200).json({ success: true, data: { answer: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    // Cover Letter
    if (action === 'cover-letter' && method === 'POST') {
      const { company, role, jobDescription, experience } = body || {};
      if (!company || !role) return res.status(400).json({ success: false, message: 'Company and role are required' });

      const prompt = `Write a compelling, professional cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription || 'Not provided'}\nYour Experience: ${experience || 'Relevant professional experience'}\n\nMake it specific to the company, highlight 2-3 relevant achievements, and end with a strong call-to-action.`;
      const { text, provider } = await callAI(prompt, 'coverLetter', { company, role, experience });

      if (user.aiCredits > 0) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1, resumeGenerations: 1 } });
      }
      return res.status(200).json({ success: true, data: { coverLetter: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    // Outreach
    if (action === 'outreach' && method === 'POST') {
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body || {};
      if (!recipientName) return res.status(400).json({ success: false, message: 'Recipient name is required' });

      const prompt = `Write a ${type || 'professional'} outreach message.\n\nRecipient: ${recipientName}\nTheir Role: ${recipientRole || 'Professional'}\nCompany: ${company || 'Target Company'}\nYour Background: ${yourBackground || 'Professional with relevant experience'}\nTarget Role: ${targetRole || 'Position of interest'}\n\nKeep it concise, personalized, and include a clear call-to-action.`;
      const { text, provider } = await callAI(prompt, 'outreach', { type, recipientName, company, targetRole });

      if (user.aiCredits > 0) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      }
      return res.status(200).json({ success: true, data: { message: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('AI error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
