import { GoogleGenerativeAI } from '@google/generative-ai';
import { ElevenLabs } from 'elevenlabs';
import connectDB from '../_lib/db';
import { authMiddleware } from '../_lib/auth';

let genAI = null;
let model = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) return;
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

initGemini();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  const endpoint = Array.isArray(slug) ? slug.join('/') : slug;

  await connectDB();

  switch (endpoint) {
    case 'status': {
      return res.json({ success: true, data: { usingAI: !!genAI } });
    }

    case 'answer': {
      if (req.method !== 'POST') return res.status(405).end();
      const { question, role, tone, length } = req.body;
      if (!question) return res.status(400).json({ success: false, message: 'Question is required' });

      const toneMap = { professional: 'professional and formal', friendly: 'friendly and conversational', confident: 'confident and direct', concise: 'brief and to the point' };
      const lengthMap = { short: '2-3 sentences', medium: '1-2 paragraphs', detailed: 'detailed with examples' };

      const prompt = `You are an AI interview coach. Answer this interview question:\n"${question}"\n\nRole: ${role || 'Any'}\nTone: ${toneMap[tone] || toneMap.professional}\nLength: ${lengthMap[length] || lengthMap.medium}\n\nProvide a well-structured, compelling answer.`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        return res.json({ success: true, data: { answer: text } });
      } catch (error) {
        console.error('Answer error:', error);
        return res.status(500).json({ success: false, message: 'Error generating answer' });
      }
    }

    case 'outreach': {
      if (req.method !== 'POST') return res.status(405).end();
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = req.body;
      if (!type || !recipientName || !company) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
      }

      const prompts = {
        linkedin: `Write a professional LinkedIn connection request message to ${recipientName}, ${recipientRole || 'professional'} at ${company}. Context: ${yourBackground || 'I am interested in connecting'}. Target role: ${targetRole || 'general opportunities'}. Keep it under 300 characters, friendly but professional.`,
        email: `Write a professional cold email to ${recipientName}, ${recipientRole || 'Hiring Manager'} at ${company}. My background: ${yourBackground || 'I am a qualified candidate'}. Target role: ${targetRole || 'the position'}. Include subject line and body. Be concise and compelling.`,
        followup: `Write a follow-up message to ${recipientName} at ${company}. Target role: ${targetRole || 'the position'}. Keep it brief (2-3 sentences), polite, and show continued interest.`
      };

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompts[type] || prompts.linkedin);
        const text = (await result.response).text();
        return res.json({ success: true, data: { message: text } });
      } catch (error) {
        console.error('Outreach error:', error);
        return res.status(500).json({ success: false, message: 'Error generating message' });
      }
    }

    case 'cover-letter': {
      if (req.method !== 'POST') return res.status(405).end();
      const { company, role, jobDescription, experience } = req.body;
      if (!company || !role) {
        return res.status(400).json({ success: false, message: 'Company and role are required' });
      }

      const prompt = `Write a professional cover letter for the position of ${role} at ${company}.\n\nJob Description:\n${jobDescription || 'General position'}\n\nMy Experience/Background:\n${experience || 'Relevant professional experience'}\n\nMake it compelling, 3-4 paragraphs, ATS-friendly.`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        return res.json({ success: true, data: { coverLetter: text } });
      } catch (error) {
        console.error('Cover letter error:', error);
        return res.status(500).json({ success: false, message: 'Error generating cover letter' });
      }
    }

    case 'interview-prep': {
      if (req.method !== 'POST') return res.status(405).end();
      const { role, difficulty } = req.body;

      const prompt = `Generate 5 interview questions for a ${role || 'professional'} position at ${difficulty || 'medium'} difficulty level. Include a mix of behavioral and technical questions. Format as a JSON array with fields: question, type (behavioral/technical), difficulty.`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const clean = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const questions = JSON.parse(clean);
        return res.json({ success: true, data: { questions } });
      } catch (error) {
        console.error('Interview prep error:', error);
        return res.status(500).json({ success: false, message: 'Error generating questions' });
      }
    }

    case 'voice-over': {
      if (req.method !== 'POST') return res.status(405).end();
      const { text, voiceType, tone, speed } = req.body;
      if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

      const voices = {
        rachel: '21m00Tcm4TlvDq8ikWAM',
        drew: 'iP9lXDMvg5BSgDq2JjPh',
        clyde: '2K4WGlGh0E6e6e9uCdF8'
      };

      try {
        if (!process.env.ELEVENLABS_API_KEY) {
          return res.json({
            success: true,
            data: {
              audioUrl: `data:audio/mp3;base64,${Buffer.from(`Demo voice-over for: ${text.substring(0, 100)}...`).toString('base64')}`,
              message: 'Demo mode - add ElevenLabs API key for real voice-overs'
            }
          });
        }

        const elevenlabs = new ElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY });
        const voiceId = voices[voiceType] || voices.rachel;

        const audio = await elevenlabs.textToSpeech.convert(voiceId, {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        });

        const buffer = Buffer.from(await audio.arrayBuffer());
        return res.json({
          success: true,
          data: {
            audioUrl: `data:audio/mp3;base64,${buffer.toString('base64')}`,
            duration: Math.ceil(text.split(' ').length / 2.5)
          }
        });
      } catch (error) {
        console.error('Voice-over error:', error);
        return res.status(500).json({ success: false, message: 'Error generating voice-over' });
      }
    }

    case 'voices': {
      return res.json({
        success: true,
        data: {
          voices: [
            { id: 'rachel', name: 'Rachel', gender: 'Female', description: 'Warm and professional' },
            { id: 'drew', name: 'Drew', gender: 'Male', description: 'Deep and authoritative' },
            { id: 'clyde', name: 'Clyde', gender: 'Male', description: 'Friendly and energetic' }
          ]
        }
      });
    }

    case 'interview-questions': {
      if (req.method !== 'POST') return res.status(405).end();
      const { jobRole, interviewType } = req.body;
      if (!jobRole) return res.status(400).json({ success: false, message: 'Job role is required' });

      const typeContext = {
        behavioral: 'Focus on past experiences and STAR method responses',
        technical: 'Focus on technical knowledge and problem-solving',
        situational: 'Focus on hypothetical scenarios and decision-making'
      };

      const prompt = `Generate 5 ${interviewType || 'technical'} interview questions for a ${jobRole} position. ${typeContext[interviewType] || ''}\n\nFormat as JSON: { "questions": [{ "id": 1, "question": "...", "type": "...", "tips": "..." }] }`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const clean = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const data = JSON.parse(clean);
        return res.json({ success: true, data });
      } catch (error) {
        console.error('Interview questions error:', error);
        return res.status(500).json({ success: false, message: 'Error generating questions' });
      }
    }

    case 'analyze-answer': {
      if (req.method !== 'POST') return res.status(405).end();
      const { question, answer, interviewType } = req.body;
      if (!question || !answer) return res.status(400).json({ success: false, message: 'Question and answer are required' });

      const prompt = `Analyze this interview answer for a ${interviewType || 'professional'} role.\n\nQuestion: ${question}\n\nAnswer: ${answer}\n\nProvide feedback on: content quality, clarity, confidence, STAR method usage, and suggestions for improvement. Format as JSON: { "score": 0-10, "strengths": [...], "improvements": [...], "overallFeedback": "..." }`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const clean = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const analysis = JSON.parse(clean);
        return res.json({ success: true, data: { ...analysis, usingAI: true } });
      } catch (error) {
        console.error('Analyze answer error:', error);
        return res.status(500).json({ success: false, message: 'Error analyzing answer' });
      }
    }

    case 'goal-tracker': {
      if (req.method !== 'POST') return res.status(405).end();
      const user = await authMiddleware(req, res);
      if (!user) return;

      const { goal, targetDays, currentProgress } = req.body;
      if (!goal) return res.status(400).json({ success: false, message: 'Goal is required' });

      const prompt = `You are an AI Job Goal Tracker. Create a structured plan for: "${goal}"\n${targetDays ? `Target: ${targetDays} days` : 'Default target: 60 days'}\n${currentProgress ? `Current progress: ${currentProgress}` : ''}\n\nRespond ONLY with valid JSON:\n{ "goal": "...", "targetDays": number, "daysRemaining": number, "phases": [{ "phase": "...", "days": "...", "tasks": ["..."], "milestone": "..." }], "weeklyTargets": ["..."], "dailyActions": ["..."], "successMetrics": ["..."], "suggestions": ["..."] }`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const clean = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const plan = JSON.parse(clean);
        return res.json({ success: true, data: { ...plan, createdAt: new Date().toISOString() } });
      } catch (error) {
        console.error('Goal tracker error:', error);
        return res.status(500).json({ success: false, message: 'Error generating goal plan' });
      }
    }

    case 'tailor-resume': {
      if (req.method !== 'POST') return res.status(405).end();
      const user = await authMiddleware(req, res);
      if (!user) return;

      const { resume, jobDescription, targetRole } = req.body;
      if (!resume || !jobDescription) {
        return res.status(400).json({ success: false, message: 'Resume and job description are required' });
      }

      const prompt = `Tailor the resume for the specific job.\n\nTARGET ROLE: ${targetRole || 'Position'}\n\nORIGINAL RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRespond ONLY with valid JSON:\n{ "tailoredSummary": "...", "keyAdditions": ["..."], "relevantExperience": [{ "original": "...", "tailored": "..." }], "skillsToHighlight": ["..."], "atsKeywords": ["..."], "missingKeywords": ["..."], "tailoredResume": "..." }`;

      try {
        if (!model) throw new Error('AI not configured');
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const clean = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const tailored = JSON.parse(clean);
        return res.json({ success: true, data: { ...tailored, createdAt: new Date().toISOString() } });
      } catch (error) {
        console.error('Resume tailoring error:', error);
        return res.status(500).json({ success: false, message: 'Error tailoring resume' });
      }
    }

    default:
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
}
