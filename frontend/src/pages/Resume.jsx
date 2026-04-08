import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const Resume = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFile(droppedFile)) {
      setFile(droppedFile);
      setAnalysisResult(null);
    } else {
      setError('Please upload a PDF or DOCX file');
    }
  };

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      setAnalysisResult(null);
    } else if (selectedFile) {
      setError('Please upload a PDF or DOCX file');
    }
  };

  const isValidFile = (f) => f && (f.type === 'application/pdf' || f.name.endsWith('.docx') || f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError('');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result; // data:application/pdf;base64,...
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileType = file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'pdf' : 'docx';

      const res = await apiService.analyzeResume(base64, fileType);
      if (res.success) {
        setAnalysisResult(res.data);
      } else {
        setError(res.message || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-500/20 text-red-400';
    if (priority === 'medium') return 'bg-amber-500/20 text-amber-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const reset = () => {
    setFile(null);
    setAnalysisResult(null);
    setError('');
  };

  const analysis = analysisResult?.analysis;
  const sectionScores = analysis?.sectionScores;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-light" />
            <span>Resume Tools</span>
          </h1>
          <p className="text-gray-400">Upload your resume for AI-powered ATS analysis and improvement suggestions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Upload Section */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-card p-12 border-2 border-dashed transition-all cursor-pointer ${
              isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => document.getElementById('resume-upload').click()}
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-primary-light" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Your Resume</h3>
              <p className="text-gray-400 mb-6">Drag and drop or click to upload (PDF, DOCX)</p>
              <input
                type="file"
                id="resume-upload"
                onChange={handleFileChange}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />
              <label
                htmlFor="resume-upload"
                className="gradient-btn px-6 py-3 rounded-xl text-white font-medium cursor-pointer inline-flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
              </label>
            </div>
          </div>
        )}

        {/* File Selected */}
        {file && !analysisResult && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-primary-light" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={reset}
                  className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing}
                  className="gradient-btn px-6 py-3 rounded-xl text-white font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && analysis && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Overall ATS Score</h2>
                  <p className="text-gray-400 text-sm">{analysis.summary}</p>
                </div>
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r="56" fill="none"
                      stroke={analysis.score >= 80 ? '#34d399' : analysis.score >= 60 ? '#fbbf24' : '#f87171'}
                      strokeWidth="8"
                      strokeDasharray={`${(analysis.score / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}</span>
                    <span className={`text-xs ${getScoreColor(analysis.score)}`}>{getScoreLabel(analysis.score)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Scores */}
            {sectionScores && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Section Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(sectionScores).map(([section, score]) => (
                    <div key={section}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs capitalize">{section}</span>
                        <span className={`text-xs font-medium ${getScoreColor(score)}`}>{score}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Keywords Found</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.keywordsFound || []).map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Missing Keywords</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.keywordsMissing || []).map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Suggested Improvements</h3>
              <div className="space-y-3">
                {(analysis.improvements || []).map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5">
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </div>
                    <p className="text-gray-300 text-sm flex-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Tips */}
            {analysis.atsTips && analysis.atsTips.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-3">ATS Optimization Tips</h3>
                <ul className="space-y-2">
                  {(analysis.atsTips || []).map((tip, i) => (
                    <li key={i} className="flex items-start space-x-2 text-gray-400 text-sm">
                      <span className="text-primary-light mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Analyze Another Resume</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Resume;
