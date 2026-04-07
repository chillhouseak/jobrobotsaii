import { useState, useEffect, useRef } from 'react';
import {
  FileText, Sparkles, Loader2, Copy, CheckCircle2, Upload, X, File,
  RefreshCw, Clock, Trash2, Eye, ChevronRight, AlertCircle,
  TrendingUp, Target, Zap, BookOpen, Code2, GraduationCap, Briefcase,
  ListChecks, SearchCheck, Lightbulb
} from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useTheme } from '../context/ThemeContext';

const MAX_FILE_SIZE = 500000; // 500KB in bytes

// Parse report into structured sections for rich display
const parseReport = (report) => {
  if (!report) return null;

  const sections = {};
  const lines = report.split('\n');
  let currentSection = 'raw';
  let currentContent = [];

  const sectionKeys = {
    'STRENGTHS': 'strengths',
    'AREAS FOR IMPROVEMENT': 'weaknesses',
    'SECTION-WISE FEEDBACK': 'sectionFeedback',
    'SUMMARY': 'summary',
    'EXPERIENCE': 'experience',
    'SKILLS': 'skills',
    'PROJECTS': 'projects',
    'EDUCATION': 'education',
    'KEYWORD OPTIMIZATION': 'keywords',
    'ATS OPTIMIZATION TIPS': 'ats',
    'ACTIONABLE NEXT STEPS': 'nextSteps',
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    let foundSection = null;

    // Match section headers (with or without decorative chars)
    for (const [header, key] of Object.entries(sectionKeys)) {
      if (trimmed.startsWith('━━━') || trimmed.startsWith('===')) {
        const inner = trimmed.replace(/^[━=]+/, '').replace(/[━=]+$/, '').trim();
        if (inner.startsWith(header)) {
          foundSection = key;
          break;
        }
      }
      if (trimmed.toUpperCase().startsWith(header)) {
        foundSection = key;
        break;
      }
    }

    if (foundSection) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = foundSection;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });

  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  // Extract overall score
  const scoreMatch = report.match(/OVERALL SCORE:\s*(\d+(?:\.\d+)?)\s*\/?10?/i);
  sections.overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  // Store raw report for fallback
  sections.raw = report;

  return sections;
};

const getScoreColor = (score) => {
  if (!score) return 'text-gray-400';
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreLabel = (score) => {
  if (!score) return '';
  if (score >= 9) return 'Exceptional';
  if (score >= 8) return 'Strong';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Average';
  if (score >= 5) return 'Below Average';
  return 'Needs Work';
};

const getScoreBgColor = (score) => {
  if (!score) return 'bg-gray-500';
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-amber-500';
  return 'bg-red-500';
};

const ResumeTailor = () => {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('analyze');

  // Form state
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis state
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsedReport, setParsedReport] = useState(null);
  const [rawReport, setRawReport] = useState('');
  const [error, setError] = useState('');
  const [reloadedAnalysis, setReloadedAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistoryId, setLoadingHistoryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const inputsDisabled = isGenerating;

  // Load history when tab switches
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiService.getResumeAnalyses({ limit: 20 });
      if (res.success) {
        setHistory(res.data.analyses);
        setHistoryTotal(res.data.total);
      }
    } catch {
      setError('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|docx)$/i)) {
      setError('Please upload a .txt, .pdf, or .docx file');
      return;
    }
    setUploadedFile(file);
    setError('');
    try {
      const text = await file.text();
      if (!text.trim()) {
        setError('File appears to be empty or could not be read');
        setUploadedFile(null);
        return;
      }
      setResume(text);
    } catch {
      setError('Failed to read file. Please copy and paste your resume instead.');
      setUploadedFile(null);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setResume('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeResume = async () => {
    if (!resume.trim()) {
      setError('Please enter or upload your resume first.');
      return;
    }

    const resumeBytes = new TextEncoder().encode(resume).length;
    if (resumeBytes > MAX_FILE_SIZE) {
      setError('Resume is too large. Please shorten it and try again.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setParsedReport(null);
    setRawReport('');
    setReloadedAnalysis(null);

    try {
      const response = await apiService.tailorResume(
        resume.trim(),
        jobDescription.trim() || null,
        targetRole.trim() || null
      );
      if (response.success && response.data?.report) {
        const parsed = parseReport(response.data.report);
        setParsedReport(parsed);
        setRawReport(response.data.report);
        if (response.data.overallScore) {
          setParsedReport(prev => ({ ...prev, overallScore: response.data.overallScore }));
        }
        // Switch to report view
        setActiveTab('report');
      } else {
        setError(response.message || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('413')) {
        setError('Resume is too large. Please shorten it.');
      } else if (err.message && (err.message.includes('token') || err.message.includes('auth') || err.message.includes('401') || err.message.includes('403'))) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.message || 'Failed to analyze resume. Please try again.');
      }
    }

    setIsGenerating(false);
  };

  const loadAnalysis = async (id) => {
    setLoadingHistoryId(id);
    setError('');
    try {
      const res = await apiService.getResumeAnalysis(id);
      if (res.success) {
        setResume(res.data.resumeText);
        setJobDescription(res.data.jobDescription || '');
        setTargetRole(res.data.targetRole || '');
        const parsed = parseReport(res.data.report);
        setParsedReport(parsed);
        setRawReport(res.data.report);
        setAnalysisId(res.data._id);
        setReloadedAnalysis(res.data);
        setActiveTab('report');
      }
    } catch {
      setError('Failed to load analysis');
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const deleteAnalysis = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await apiService.deleteResumeAnalysis(id);
      if (res.success) {
        setHistory(prev => prev.filter(a => a._id !== id));
        setHistoryTotal(prev => prev - 1);
      }
    } catch {
      setError('Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(rawReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setParsedReport(null);
    setRawReport('');
    setError('');
    setReloadedAnalysis(null);
    setActiveTab('analyze');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Render a section block with bullet points
  const renderBullets = (content, icon, label) => {
    if (!content) return null;
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const Icon = icon;
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          {Icon && <Icon className="w-4 h-4 text-primary-light" />}
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</h3>
        </div>
        <div className="space-y-1.5">
          {lines.map((line, i) => {
            const text = line.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '');
            const isHeader = line.match(/^[A-Z][A-Z\s]+:?$/) || line.match(/^━━━/) || line.match(/^===/);
            if (isHeader && i === 0) return null;
            return (
              <div key={i} className={`flex items-start space-x-2 ${isHeader ? 'mt-2' : ''}`}>
                {!isHeader && (
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${getScoreBgColor(parsedReport?.overallScore || 7)}`} />
                )}
                <p className={`text-sm leading-relaxed ${isHeader ? 'font-semibold ' + (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-light" />
            <span>Resume Tailor</span>
          </h1>
          <p className="text-gray-400 text-sm">Get expert AI feedback on your resume — strengths, weaknesses, ATS tips, and actionable advice</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 p-1 rounded-xl inline-flex" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
          {['analyze', 'report', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab !== 'report') { setParsedReport(null); setRawReport(''); } }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'analyze' && <span className="flex items-center space-x-1.5"><Sparkles className="w-3.5 h-3.5" /><span>New Analysis</span></span>}
              {tab === 'report' && <span className="flex items-center space-x-1.5"><BookOpen className="w-3.5 h-3.5" /><span>Report</span></span>}
              {tab === 'history' && <span className="flex items-center space-x-1.5"><Clock className="w-3.5 h-3.5" /><span>History</span></span>}
            </button>
          ))}
        </div>

        {/* ======== ANALYZE TAB ======== */}
        {activeTab === 'analyze' && (
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
            {/* Target Role */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Target Role <span className="text-gray-500 text-xs">(optional — helps focus feedback)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                disabled={inputsDisabled}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>

            {/* Resume Upload */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload Your Resume
              </label>
              {uploadedFile ? (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <File className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{uploadedFile.name}</p>
                      <p className={`text-xs ${isDark ? 'text-emerald-400/60' : 'text-emerald-500'}`}>{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-100 text-emerald-600'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : isDark
                        ? 'border-white/20 bg-white/5 hover:bg-white/5 hover:border-white/30'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                  <Upload className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Drop your resume here or click to upload</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Supports .txt, .pdf, .docx</p>
                </div>
              )}
            </div>

            {/* Resume Text */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Resume Content</span>
                {uploadedFile && (
                  <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Loaded from file</span>
                )}
              </label>
              <textarea
                value={resume}
                onChange={(e) => { setResume(e.target.value); setUploadedFile(null); }}
                placeholder="Upload a file above or paste your resume text here..."
                rows={10}
                disabled={inputsDisabled}
                className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all font-mono ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>

            {/* Job Description */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Description <span className="text-gray-500 text-xs">(optional — enables keyword gap analysis)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for targeted keyword analysis..."
                rows={5}
                disabled={inputsDisabled}
                className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={analyzeResume}
              disabled={inputsDisabled || !resume.trim()}
              className="gradient-btn w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing your resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Resume</span>
                </>
              )}
            </button>

            {error && (
              <div className={`mt-3 p-3 rounded-xl text-sm flex items-start space-x-2 ${
                isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* ======== REPORT TAB ======== */}
        {activeTab === 'report' && parsedReport && (
          <div>
            {/* Report Header */}
            <div className={`p-6 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Resume Review Report</h2>
                  {parsedReport.overallScore !== null && (
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-4xl font-black ${getScoreColor(parsedReport.overallScore)}`}>
                          {parsedReport.overallScore.toFixed(1)}
                        </span>
                        <span className={`text-lg font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/10</span>
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${getScoreColor(parsedReport.overallScore)}`}>{getScoreLabel(parsedReport.overallScore)}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Overall Score</div>
                      </div>
                      {/* Score bar */}
                      <div className="flex-1 max-w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreBgColor(parsedReport.overallScore)}`}
                          style={{ width: `${(parsedReport.overallScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={copyReport} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button onClick={reset} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <RefreshCw className="w-4 h-4" />
                    <span>New Analysis</span>
                  </button>
                </div>
              </div>

              {/* Target role & context */}
              {(targetRole || parsedReport?.targetRole || reloadedAnalysis?.targetRole) && (
                <div className="flex items-center space-x-2 text-sm">
                  <Target className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Analyzing for: <span className="font-medium text-primary-light">{targetRole || reloadedAnalysis?.targetRole || parsedReport?.targetRole}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Formatted Report Body */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
              {/* Strengths */}
              {parsedReport.strengths && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Strengths</h3>
                  </div>
                  <div className="space-y-1.5">
                    {parsedReport.strengths.split('\n').filter(l => l.trim()).map((line, i) => {
                      const text = line.replace(/^[•\-*]\s*/, '');
                      return (
                        <div key={i} className="flex items-start space-x-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {parsedReport.weaknesses && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Areas for Improvement</h3>
                  </div>
                  <div className="space-y-1.5">
                    {parsedReport.weaknesses.split('\n').filter(l => l.trim()).map((line, i) => {
                      const text = line.replace(/^[•\-*]\s*/, '');
                      return (
                        <div key={i} className="flex items-start space-x-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section-wise feedback */}
              {parsedReport.sectionFeedback && (
                <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Section-wise Feedback
                  </div>
                  {parsedReport.summary && renderBullets(parsedReport.summary, Target, 'Summary')}
                  {parsedReport.experience && renderBullets(parsedReport.experience, Briefcase, 'Experience')}
                  {parsedReport.skills && renderBullets(parsedReport.skills, Code2, 'Skills')}
                  {parsedReport.projects && renderBullets(parsedReport.projects, Zap, 'Projects')}
                  {parsedReport.education && renderBullets(parsedReport.education, GraduationCap, 'Education')}
                </div>
              )}

              {/* Keyword Optimization */}
              {parsedReport.keywords && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <SearchCheck className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Keyword Optimization</h3>
                  </div>
                  <div className="space-y-1.5">
                    {parsedReport.keywords.split('\n').filter(l => l.trim()).map((line, i) => {
                      const text = line.replace(/^[•\-*]\s*/, '');
                      const isSubHeader = line.match(/^[A-Z][A-Z\s]+:?$/);
                      if (isSubHeader) {
                        return (
                          <div key={i} className={`text-xs font-semibold uppercase tracking-wide mt-3 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {text}
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="flex items-start space-x-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ATS Tips */}
              {parsedReport.ats && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <ListChecks className="w-4 h-4 text-purple-400" />
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>ATS Optimization Tips</h3>
                  </div>
                  <div className="space-y-1.5">
                    {parsedReport.ats.split('\n').filter(l => l.trim()).map((line, i) => {
                      const text = line.replace(/^[•\-*]\s*/, '');
                      return (
                        <div key={i} className="flex items-start space-x-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {parsedReport.nextSteps && (
                <div className={`mb-4 p-4 rounded-xl border ${isDark ? 'bg-primary/5 border-primary/20' : 'bg-primary/5 border-primary/20'}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary-light" />
                    <h3 className={`text-sm font-semibold uppercase tracking-wide text-primary-light`}>Actionable Next Steps</h3>
                  </div>
                  <div className="space-y-2">
                    {parsedReport.nextSteps.split('\n').filter(l => l.trim()).map((line, i) => {
                      const text = line.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '');
                      const numMatch = line.match(/^(\d+)\./);
                      return (
                        <div key={i} className="flex items-start space-x-3">
                          {numMatch && (
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                              {numMatch[1]}
                            </span>
                          )}
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Raw fallback if parsing failed */}
              {!parsedReport.strengths && !parsedReport.weaknesses && (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans" style={{ fontFamily: 'inherit' }}>
                  {rawReport}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Report tab — no report yet */}
        {activeTab === 'report' && !parsedReport && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Report Yet</h3>
            <p className={`max-w-md mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Upload your resume and run an analysis to see your personalized review report
            </p>
            <button onClick={() => setActiveTab('analyze')} className="gradient-btn px-6 py-2.5 rounded-xl text-white text-sm font-semibold">
              Start Analysis
            </button>
          </div>
        )}

        {/* ======== HISTORY TAB ======== */}
        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <div className={`p-12 rounded-2xl text-center ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-primary-light" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Analysis History</h3>
                <p className={`max-w-md mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your past resume analyses will appear here
                </p>
                <button onClick={() => setActiveTab('analyze')} className="gradient-btn px-6 py-2.5 rounded-xl text-white text-sm font-semibold">
                  Analyze Your First Resume
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {historyTotal} analysis{historyTotal !== 1 ? 'es' : ''} total
                  </p>
                </div>
                {history.map(item => (
                  <div
                    key={item._id}
                    onClick={() => loadAnalysis(item._id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                      isDark
                        ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Score badge */}
                        {item.overallScore ? (
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                            isDark ? 'bg-white/5' : 'bg-gray-100'
                          }`}>
                            <span className={`text-lg font-black ${getScoreColor(item.overallScore)}`}>
                              {item.overallScore.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <FileText className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.targetRole || 'General Resume Review'}
                          </p>
                          <div className="flex items-center space-x-3 mt-0.5">
                            <span className={`flex items-center space-x-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(item.createdAt)}</span>
                            </span>
                            {item.overallScore && (
                              <span className={`text-xs font-medium ${getScoreColor(item.overallScore)}`}>
                                {getScoreLabel(item.overallScore)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => deleteAnalysis(item._id, e)}
                          disabled={deletingId === item._id}
                          className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                            isDark
                              ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-400'
                              : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                          }`}
                        >
                          {deletingId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => loadAnalysis(item._id)}
                          disabled={loadingHistoryId === item._id}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isDark
                              ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {loadingHistoryId === item._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <><Eye className="w-3.5 h-3.5" /><span>View</span></>
                          )}
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResumeTailor;
