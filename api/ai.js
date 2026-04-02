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
const callGroq = async (prompt, systemPrompt) => {
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
      model: 'llama-3.1-8b-instant', // fast, cheap, great quality
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
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
// Free tier: rate-limited inference endpoints
// Uses a free inference endpoint — no HF token required for basic use
const callHuggingFace = async (prompt) => {
  // Use a hosted inference endpoint that doesn't require auth for free tier
  // mistralai/Mistral-7B-Instruct-v0.2 is available on HuggingFace Inference API
  const endpoint = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
  const headers = HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {};
  const body = {
    inputs: prompt,
    parameters: { max_new_tokens: 512, temperature: 0.7, return_full_text: false },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error('HF_RATE_LIMITED');
  if (res.status === 503) {
    // Model loading — wait and retry once
    await new Promise(r => setTimeout(r, 2000));
    const retry = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!retry.ok) throw new Error('HF_UNAVAILABLE');
    const data = await retry.json();
    return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
  }

  if (!res.ok) throw new Error(`HF error ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
};

// --- Gemini (Tertiary, if configured) ---
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
    const responses = {
      professional: "Thank you for the opportunity to discuss this position. With my background in this field, I have developed strong skills in problem-solving and collaboration. I am excited about the possibility of bringing this experience to your team and contributing to your company's success.",
      friendly: "Hey there! I'm really excited about this opportunity. I've been working in this space for a while now, and I've loved every bit of it. What really gets me going is solving tricky problems and working with awesome people.",
      confident: "I am the ideal candidate for this position. With proven expertise in this domain, I have consistently exceeded expectations and delivered measurable results throughout my career.",
      casual: "Honestly, this is right up my alley. I've tackled similar challenges before and I'm confident I can bring real value here.",
    };
    let text = responses[tone] || responses.professional;
    if (length === 'short') text = text.split('.')[0] + '.';
    if (length === 'long') text = text + ' ' + responses[tone];
    return text;
  },

  coverLetter: (company, role, experience) =>
    `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${role} position at ${company}. With my background in ${experience || 'software development'} and passion for delivering exceptional results, I believe I would be a valuable addition to your team.\n\nThroughout my career, I have developed strong skills that align well with your requirements. I am particularly drawn to ${company} because of its innovative approach and commitment to excellence.\n\nI am excited about the possibility of contributing to your continued success and would welcome the opportunity to discuss how my skills and experience would benefit your organization.\n\nThank you for considering my application.\n\nSincerely`,

  outreach: (type, name, company, role) => {
    const templates = {
      linkedin: `Hi ${name},\n\nI hope this message finds you well! I'm currently exploring opportunities in ${role || 'software development'} and came across your profile. Your experience is truly inspiring.\n\nI would love to connect and learn more about your journey.\n\nBest regards`,
      email: `Dear ${name},\n\nI hope this email finds you well. I am reaching out to express my interest in potential opportunities at ${company}.\n\nWith a background in ${role || 'software development'}, I am particularly drawn to organizations that value innovation and excellence.\n\nI would greatly appreciate the opportunity to connect.\n\nWarm regards`,
      referral: `Hi ${name},\n\nI hope you're doing well! I'm reaching out because I'm very interested in opportunities at ${company}.\n\nIf you know of anyone on your team who might be able to refer me, I would greatly appreciate it.\n\nThank you!`,
      followup: `Hi ${name},\n\nI wanted to follow up on my previous message regarding opportunities at ${company}.\n\nI remain very interested in contributing to your team.\n\nBest regards`,
    };
    return templates[type] || templates.linkedin;
  },

  goalTracker: (goal, timeframe) =>
    `# Action Plan: ${goal}\n\n**Timeframe:** ${timeframe || '3 months'}\n\n## Phase 1: Foundation (Weeks 1-2)\n- Research the target role and industry trends\n- Update resume and LinkedIn profile\n- Identify 5-10 companies that match your goals\n\n## Phase 2: Active Search (Weeks 3-6)\n- Apply to 3-5 positions per week\n- Network with professionals in the field\n- Practice interview questions daily\n\n## Phase 3: Interviews & Follow-up (Weeks 7-10)\n- Prepare for each interview with company research\n- Send thank-you notes within 24 hours\n- Follow up on pending applications\n\n## Phase 4: Decision (Weeks 11-12)\n- Evaluate offers carefully\n- Negotiate terms if applicable\n- Plan for a smooth transition\n\n## Weekly Targets\n1. Submit at least 3 quality applications\n2. Complete 2 networking outreach messages\n3. Practice 5+ interview questions\n4. Track all activities in your tracker`,

  tailorResume: (jobDescription) =>
    `# Tailored Resume Summary\n\n**Key Match:** Your resume should highlight skills and experience that directly align with:\n${jobDescription}\n\n## ATS Keywords to Include\n- Review the job description for repeated terms\n- Include technical skills and tools mentioned\n- Use industry-standard keywords\n\n## Tailored Summary\nRewrite your professional summary to include:\n1. Years of relevant experience\n2. Key technical skills matching the role\n3. A measurable achievement or impact\n\n## Action Verbs to Use\nImplemented, Developed, Led, Optimized, Increased, Reduced, Streamlined, Architected\n\n*Tip: Tailor each resume for every application. Quality over quantity wins.*`,
};

// ================================================================
// UNIFIED AI CALL — tries providers in order
// ================================================================
const callAI = async (prompt, options = {}) => {
  const { feature, context = {} } = options;

  // 1. Try Groq (fastest, most generous free tier)
  if (GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      console.log('[AI] Trying Groq...');
      const result = await callGroq(prompt);
      console.log('[AI] Groq succeeded');
      return { text: result, provider: 'groq' };
    } catch (err) {
      if (err.message !== 'GROQ_RATE_LIMITED') {
        console.warn('[AI] Groq failed:', err.message);
      } else {
        console.warn('[AI] Groq rate limited, trying next provider...');
      }
    }
  }

  // 2. Try HuggingFace (free inference)
  try {
    console.log('[AI] Trying HuggingFace...');
    const result = await callHuggingFace(prompt);
    console.log('[AI] HuggingFace succeeded');
    return { text: result, provider: 'huggingface' };
  } catch (err) {
    console.warn('[AI] HuggingFace failed:', err.message);
  }

  // 3. Try Gemini (if configured)
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      console.log('[AI] Trying Gemini...');
      const result = await callGemini(prompt);
      console.log('[AI] Gemini succeeded');
      return { text: result, provider: 'gemini' };
    } catch (err) {
      console.warn('[AI] Gemini failed:', err.message);
    }
  }

  // 4. Fallback to mock responses
  console.log('[AI] All providers failed — using mock response');
  return getMockResponse(feature, context);
};

const getMockResponse = (feature, context = {}) => {
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
// EXPRESS APP SETUP
// ================================================================
import express from 'express';
const app = express();

app.use(express.json());

// CORS
app.use((_req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  next();
});

// Preflight
app.options('*', (_req, res) => res.status(200).end());

// ================================================================
// AUTH MIDDLEWARE
// ================================================================
const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw Object.assign(new Error('No token'), { name: 'AuthError' });
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

// ================================================================
// IMAGE GENERATION (Pollinations — always free, no AI key needed)
// ================================================================
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024, seed, style } = req.body || {};
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const encoded = encodeURIComponent(prompt.trim());
    const styleParam = style && style !== 'none' ? `&model=${style}` : '';
    const seedParam = seed ? `&seed=${seed}` : '';
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}${seedParam}${styleParam}&nologo=true`;

    res.json({
      success: true,
      data: {
        imageUrl,
        prompt: prompt.trim(),
        width,
        height,
        seed: seed || Math.floor(Math.random() * 999999999),
      },
    });
  } catch (err) {
    console.error('Image error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// GOAL TRACKER (public)
// ================================================================
app.post('/api/ai/goal-tracker', async (req, res) => {
  try {
    await connectDB();
    const { goal, role: _role, timeframe, obstacles } = req.body || {};
    if (!goal) return res.status(400).json({ success: false, message: 'Goal is required' });

    const prompt = `You are an expert career coach. Create a detailed, actionable plan for this goal.\n\nGoal: ${goal}\nTimeframe: ${timeframe || '3 months'}\nObstacles: ${obstacles || 'Limited time, resource constraints'}\n\nProvide a structured plan with phases, weekly tasks, daily actions, and success metrics. Be specific and practical.`;
    const { text, provider } = await callAI(prompt, { feature: 'goalTracker', context: { goal, timeframe } });

    res.json({ success: true, data: { result: text, provider } });
  } catch (err) {
    console.error('Goal tracker error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// RESUME TAILOR (public)
// ================================================================
app.post('/api/ai/tailor-resume', async (req, res) => {
  try {
    await connectDB();
    const { resume, jobDescription, targetRole } = req.body || {};
    if (!resume || !jobDescription) return res.status(400).json({ success: false, message: 'Resume and job description are required' });

    const prompt = `You are a professional resume writer. Tailor this resume for the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nTarget Role: ${targetRole || 'the role above'}\n\nRewrite the resume to highlight the most relevant skills. Keep it concise. Use action verbs and quantify achievements. Return in clean markdown.`;
    const { text, provider } = await callAI(prompt, { feature: 'tailorResume', context: { jobDescription } });

    res.json({ success: true, data: { tailoredResume: text, provider } });
  } catch (err) {
    console.error('Tailor resume error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// PROTECTED ROUTES
// ================================================================
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    await connectDB();
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
    req.user = user;
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
    }
    return res.status(401).json({ success: false, message: err.message });
  }
});

// Answer Generator
app.post('/api/ai/answer', async (req, res) => {
  try {
    const { question, role, tone, length } = req.body || {};
    if (!question) return res.status(400).json({ success: false, message: 'Question is required' });

    const prompt = `You are an expert interview coach. Answer the following interview question clearly and effectively.\n\nQuestion: ${question}\nRole: ${role || 'Professional'}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'}\n\nProvide a clear, concise answer.`;
    const { text, provider } = await callAI(prompt, { feature: 'answer', context: { role, tone, length } });

    await User.findByIdAndUpdate(req.userId, { $inc: { aiCredits: -1 } });
    res.json({ success: true, data: { answer: text, provider, creditsRemaining: req.user.aiCredits - 1 } });
  } catch (err) {
    console.error('Answer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Status
app.get('/api/ai/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      credits: 999999, // unlimited with Groq/HF
      plan: 'free',
      provider: GROQ_API_KEY ? 'groq' : HF_API_KEY ? 'huggingface' : 'mock',
    },
  });
});

// Cover Letter
app.post('/api/ai/cover-letter', async (req, res) => {
  try {
    const { company, role, jobDescription, experience } = req.body || {};
    if (!company || !role) return res.status(400).json({ success: false, message: 'Company and role are required' });

    const prompt = `Write a compelling, professional cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription || 'Not provided'}\nYour Experience: ${experience || 'Relevant professional experience'}\n\nMake it specific to the company, highlight 2-3 relevant achievements, and end with a strong call-to-action.`;
    const { text, provider } = await callAI(prompt, { feature: 'coverLetter', context: { company, role, experience } });

    await User.findByIdAndUpdate(req.userId, { $inc: { aiCredits: -1, resumeGenerations: 1 } });
    res.json({ success: true, data: { coverLetter: text, provider, creditsRemaining: req.user.aiCredits - 1 } });
  } catch (err) {
    console.error('Cover letter error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Outreach
app.post('/api/ai/outreach', async (req, res) => {
  try {
    const { type, recipientName, recipientRole, company, yourBackground, targetRole } = req.body || {};
    if (!recipientName) return res.status(400).json({ success: false, message: 'Recipient name is required' });

    const prompt = `Write a ${type || 'professional'} outreach message.\n\nRecipient: ${recipientName}\nTheir Role: ${recipientRole || 'Professional'}\nCompany: ${company || 'Target Company'}\nYour Background: ${yourBackground || 'Professional with relevant experience'}\nTarget Role: ${targetRole || 'Position of interest'}\n\nKeep it concise, personalized, and includes a clear call-to-action.`;
    const { text, provider } = await callAI(prompt, { feature: 'outreach', context: { type, recipientName, company, targetRole } });

    await User.findByIdAndUpdate(req.userId, { $inc: { aiCredits: -1 } });
    res.json({ success: true, data: { message: text, provider, creditsRemaining: req.user.aiCredits - 1 } });
  } catch (err) {
    console.error('Outreach error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// DATABASE CONNECTION
// ================================================================
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

// ================================================================
// HEALTH CHECKS & CATCH-ALL
// ================================================================
app.get('/health', (_req, res) => res.json({ success: true, message: 'JobRobots AI API running' }));
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'JobRobots AI API running' }));
app.get('/api/ai/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      provider: GROQ_API_KEY ? 'groq' : HF_API_KEY ? 'huggingface' : 'mock',
      groqConfigured: !!GROQ_API_KEY,
      hfConfigured: !!HF_API_KEY,
      geminiConfigured: !!GEMINI_API_KEY,
    },
  });
});

// Catch-all for API
app.get('/{*splat}', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
