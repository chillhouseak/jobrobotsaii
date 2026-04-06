import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  resumeText: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    default: '',
  },
  targetRole: {
    type: String,
    default: '',
  },
  report: {
    type: String,
    required: true,
  },
  overallScore: {
    type: Number,
    default: null,
  },
  provider: {
    type: String,
    enum: ['groq', 'huggingface', 'gemini', 'mock'],
    default: 'mock',
  },
}, { timestamps: true });

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
