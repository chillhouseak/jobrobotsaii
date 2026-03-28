import { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';

const Resume = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [score, setScore] = useState(0);

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf' || droppedFile?.name.endsWith('.docx')) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const analyzeResume = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setScore(72);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const improvements = [
    { type: 'add', text: 'Add quantified metrics to your achievements', priority: 'high' },
    { type: 'add', text: 'Include more keywords from job descriptions', priority: 'high' },
    { type: 'improve', text: 'Make your summary more specific', priority: 'medium' },
    { type: 'format', text: 'Improve formatting consistency', priority: 'low' },
  ];

  const keywords = {
    found: ['React', 'Node.js', 'Python', 'AWS', 'Team Leadership'],
    missing: ['Docker', 'Kubernetes', 'CI/CD', 'GraphQL'],
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-light" />
            <span>Resume Tools</span>
          </h1>
          <p className="text-gray-400">Analyze and improve your resume for ATS success</p>
        </div>

        {/* Upload Section */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-card p-12 border-2 border-dashed transition-all ${
              isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
            }`}
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
                accept=".pdf,.docx"
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
        {file && !analysisComplete && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-primary-light" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={analyzeResume}
                disabled={isAnalyzing}
                className="gradient-btn px-6 py-3 rounded-xl text-white font-medium flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisComplete && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Overall Score</h2>
                  <p className="text-gray-400 text-sm">ATS Compatibility Score</p>
                </div>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r="56" fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeDasharray={`${(score / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keywords Found */}
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Keywords Found</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.found.map((kw, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keywords Missing */}
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Missing Keywords</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.missing.map((kw, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm">
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
                {improvements.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.priority === 'high' ? 'bg-red-400' :
                      item.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    <p className="text-gray-300 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setAnalysisComplete(false); setFile(null); }}
              className="w-full py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Resume;
