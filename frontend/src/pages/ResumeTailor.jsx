import { useState, useRef } from 'react';
import { FileText, Sparkles, Loader2, Copy, CheckCircle2, Upload, X, Download, File } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ResumeTailor = () => {
  const { isDark } = useTheme();
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
      setResume(text);
    } catch (err) {
      setError('Failed to read file. Please copy and paste your resume instead.');
      setUploadedFile(null);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setResume('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tailorResume = async () => {
    if (!resume.trim() || !jobDescription.trim()) return;

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.tailorResume(resume.trim(), jobDescription.trim(), targetRole.trim() || null);
      if (response.success) {
        setResult(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to tailor resume');
    }

    setIsGenerating(false);
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(''), 2000);
  };

  const downloadFullResume = () => {
    if (!result?.tailoredResume) return;
    const blob = new Blob([result.tailoredResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailored-resume-${targetRole || 'job'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-light" />
            <span>AI Resume Tailoring</span>
          </h1>
          <p className="text-gray-400">Customize your resume for any job posting — ATS-friendly & keyword-optimized</p>
        </div>

        {/* Input Section */}
        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
          {/* Target Role */}
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Target Role <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
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
              /* File uploaded — show file info */
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  }`}>
                    <File className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{uploadedFile.name}</p>
                    <p className={`text-xs ${isDark ? 'text-emerald-400/60' : 'text-emerald-500'}`}>
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Dropzone */
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <Upload className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Drop your resume here or click to upload
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Supports .txt, .pdf, .docx
                </p>
              </div>
            )}
          </div>

          {/* Resume Text — editable after upload or manual paste */}
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span>Resume Content</span>
              {uploadedFile && (
                <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Auto-loaded from file</span>
              )}
            </label>
            <textarea
              value={resume}
              onChange={(e) => { setResume(e.target.value); setUploadedFile(null); }}
              placeholder="Upload a file above or paste your resume text here..."
              rows={10}
              className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all font-mono ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Job Description Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
              className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={tailorResume}
            disabled={isGenerating || !resume.trim() || !jobDescription.trim()}
            className="gradient-btn w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Tailoring your resume...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Tailor Resume</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5">
            {/* Tailored Summary */}
            {result.tailoredSummary && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Customized Summary</h3>
                  <button
                    onClick={() => copyToClipboard(result.tailoredSummary, 'summary')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {copied === 'summary' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'summary' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {result.tailoredSummary}
                </p>
              </div>
            )}

            {/* ATS Keywords & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.atsKeywords?.length > 0 && (
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>ATS Keywords Found</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.atsKeywords.map((kw, i) => (
                      <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missingKeywords?.length > 0 && (
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Add these to your resume to improve ATS match
                  </p>
                </div>
              )}
            </div>

            {/* Key Additions */}
            {result.keyAdditions?.length > 0 && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Key Additions</h3>
                <div className="space-y-2">
                  {result.keyAdditions.map((item, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-light mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relevant Experience Comparisons */}
            {result.relevantExperience?.length > 0 && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Experience Rewrites</h3>
                <div className="space-y-4">
                  {result.relevantExperience.map((exp, i) => (
                    <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                      <div className="mb-2">
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ORIGINAL</span>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{exp.original}</p>
                      </div>
                      <div>
                        <span className={`text-xs font-medium text-primary-light`}>TAILORED</span>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{exp.tailored}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills to Highlight */}
            {result.skillsToHighlight?.length > 0 && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Skills to Highlight</h3>
                <div className="flex flex-wrap gap-2">
                  {result.skillsToHighlight.map((skill, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary/20 text-primary-light' : 'bg-primary/10 text-primary'}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full Tailored Resume */}
            {result.tailoredResume && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Full Tailored Resume</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(result.tailoredResume, 'resume')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {copied === 'resume' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied === 'resume' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={downloadFullResume}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className={`whitespace-pre-wrap text-sm font-mono leading-relaxed p-4 rounded-xl ${isDark ? 'bg-black/30 text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
                  {result.tailoredResume}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !isGenerating && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ready to Tailor</h3>
            <p className={`max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Upload your resume and paste the job description above to get an ATS-optimized, keyword-matched tailored resume
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResumeTailor;
