import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const Resume = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [extractionMethod, setExtractionMethod] = useState('');
  const fileInputRef = useRef(null);

  const isValidFile = (f) =>
    f && (
      f.type === 'application/pdf' ||
      f.name.endsWith('.pdf') ||
      f.name.endsWith('.docx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

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

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError('');

    try {
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'docx';
      const res = await apiService.analyzeResume(base64, fileType);

      if (res.success) {
        setAnalysisResult(res.data);
        setExtractionMethod(res.data.extractionMethod || '');
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
    if (score >= 80) return { text: 'text-emerald-400', ring: '#34d399' };
    if (score >= 60) return { text: 'text-amber-400', ring: '#fbbf24' };
    return { text: 'text-red-400', ring: '#f87171' };
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (priority === 'medium') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  const analysis = analysisResult?.analysis;
  const scoreColor = analysis ? getScoreColor(analysis.score) : null;
  const scorePercent = analysis ? (analysis.score / 100) * 352 : 0;

  const reset = () => {
    setFile(null);
    setAnalysisResult(null);
    setError('');
    setExtractionMethod('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getMethodLabel = (method) => {
    const labels = {
      'mammoth': 'DOCX (mammoth)',
      'pdf-parse-v1': 'PDF (text extraction)',
      'pdf-parse-v2': 'PDF (modern parser)',
      'pdfjs-dist': 'PDF (browser parser)',
      'tesseract-ocr': 'PDF (OCR - scanned)',
    };
    return labels[method] || method;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-light" />
            <span>Resume Analyzer</span>
          </h1>
          <p className="text-gray-400">
            Upload your resume for AI-powered ATS analysis — real insights from your actual content
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Zone */}
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-card p-12 border-2 border-dashed cursor-pointer transition-all text-center ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Resume</h3>
            <p className="text-gray-400 mb-6">Drag and drop or click to upload (PDF, DOCX)</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <span className="gradient-btn px-6 py-3 rounded-xl text-white font-medium inline-flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Choose File</span>
            </span>
          </div>
        )}

        {/* File Selected — Ready to Analyze */}
        {file && !analysisResult && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-primary-light" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB &middot; {file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={reset}
                  className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing}
                  className="gradient-btn px-6 py-3 rounded-xl text-white font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[240px]">
                  <h2 className="text-lg font-semibold text-white mb-1">ATS Score</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{analysis.summary}</p>
                  {extractionMethod && (
                    <p className="text-xs text-gray-600 mt-2">
                      Extracted via: {getMethodLabel(extractionMethod)}
                    </p>
                  )}
                </div>
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="64" cy="64" r="56" fill="none"
                      stroke={scoreColor.ring}
                      strokeWidth="10"
                      strokeDasharray={`${scorePercent} 352`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${scoreColor.text}`}>{analysis.score}</span>
                    <span className={`text-xs font-medium ${scoreColor.text}`}>
                      {analysis.score >= 80 ? 'Excellent' : analysis.score >= 60 ? 'Good' : analysis.score >= 40 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Scores */}
            {analysis.sectionScores && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-5">Section Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {Object.entries(analysis.sectionScores).map(([section, score]) => {
                    const colors = score >= 75 ? { bar: 'bg-emerald-400', text: 'text-emerald-400' }
                      : score >= 50 ? { bar: 'bg-amber-400', text: 'text-amber-400' }
                      : { bar: 'bg-red-400', text: 'text-red-400' };
                    return (
                      <div key={section}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-gray-400 text-xs capitalize">{section}</span>
                          <span className={`text-xs font-semibold ${colors.text}`}>{score}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
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
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm border border-emerald-500/20">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Keywords Missing</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.keywordsMissing || []).map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-sm border border-amber-500/20">
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
                    <span className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm">{item.text}</p>
                      {item.section && (
                        <p className="text-xs text-gray-600 mt-1 capitalize">Section: {item.section}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Tips */}
            {analysis.atsTips && analysis.atsTips.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">ATS Optimization Tips</h3>
                <ul className="space-y-2">
                  {(analysis.atsTips || []).map((tip, i) => (
                    <li key={i} className="flex items-start space-x-2 text-gray-400 text-sm">
                      <span className="text-primary-light mt-0.5 flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyze Another */}
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
