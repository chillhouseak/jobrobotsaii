import { useState } from 'react';
import { Sparkles, Copy, Check, MessageSquare, Mail, FileText, Zap, Loader2, Image } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import ImageGenerator from '../components/ImageGenerator';

const AITools = () => {
  const [activeTab, setActiveTab] = useState('answer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [answerForm, setAnswerForm] = useState({
    question: '', role: '', tone: 'professional', length: 'medium'
  });
  const [answerOutput, setAnswerOutput] = useState('');

  const [outreachForm, setOutreachForm] = useState({
    recipientName: '', recipientRole: '', company: '', yourBackground: '', targetRole: '', keyPoints: ''
  });
  const [outreachOutput, setOutreachOutput] = useState('');
  const [outreachType, setOutreachType] = useState('linkedin');

  const [coverForm, setCoverForm] = useState({
    company: '', role: '', jobDescription: '', experience: ''
  });
  const [coverOutput, setCoverOutput] = useState('');

  const handleCopy = () => {
    const text = answerOutput || outreachOutput || coverOutput;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAnswer = async () => {
    if (!answerForm.question) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateAnswer(
        answerForm.question,
        answerForm.role,
        answerForm.tone,
        answerForm.length
      );
      if (response.success) {
        setAnswerOutput(response.data.answer);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
    }
    setIsGenerating(false);
  };

  const generateOutreach = async () => {
    if (!outreachForm.recipientName) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateOutreach(
        outreachType,
        outreachForm.recipientName,
        outreachForm.recipientRole,
        outreachForm.company,
        outreachForm.yourBackground,
        outreachForm.targetRole
      );
      if (response.success) {
        setOutreachOutput(response.data.message);
      }
    } catch (error) {
      console.error('Error generating outreach:', error);
    }
    setIsGenerating(false);
  };

  const generateCover = async () => {
    if (!coverForm.company || !coverForm.role) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateCoverLetter(
        coverForm.company,
        coverForm.role,
        coverForm.jobDescription,
        coverForm.experience
      );
      if (response.success) {
        setCoverOutput(response.data.coverLetter);
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
    }
    setIsGenerating(false);
  };

  const tabs = [
    { id: 'answer', label: 'Answer Generator', icon: MessageSquare },
    { id: 'outreach', label: 'Cold Outreach', icon: Mail },
    { id: 'cover', label: 'Cover Letter', icon: FileText },
    { id: 'image', label: 'Image Generator', icon: Image },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary-light" />
            <span>AI Tools</span>
          </h1>
          <p className="text-gray-400">Powerful AI tools to supercharge your job search</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Answer Generator */}
        {activeTab === 'answer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Your Answer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Interview Question</label>
                  <textarea
                    value={answerForm.question}
                    onChange={(e) => setAnswerForm({...answerForm, question: e.target.value})}
                    placeholder="Tell me about yourself..."
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Role / Position</label>
                    <input
                      type="text"
                      value={answerForm.role}
                      onChange={(e) => setAnswerForm({...answerForm, role: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tone</label>
                    <select
                      value={answerForm.tone}
                      onChange={(e) => setAnswerForm({...answerForm, tone: e.target.value})}
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="confident">Confident</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Length</label>
                  <div className="flex space-x-2">
                    {['short', 'medium', 'long'].map((len) => (
                      <button
                        key={len}
                        onClick={() => setAnswerForm({...answerForm, length: len})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          answerForm.length === len
                            ? 'bg-primary/20 text-white border border-primary/50'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={generateAnswer}
                  disabled={isGenerating || !answerForm.question}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Answer</h2>
                {answerOutput && (
                  <div className="flex space-x-2">
                    <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[300px]">
                {answerOutput ? (
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{answerOutput}</p>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your generated answer will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cold Outreach */}
        {activeTab === 'outreach' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Outreach Message</h2>

              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {['linkedin', 'email', 'referral', 'followup'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOutreachType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      outreachType === type
                        ? 'bg-primary/20 text-white border border-primary/50'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {type === 'followup' ? 'Follow-up' : type}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Recipient Name</label>
                    <input
                      type="text"
                      value={outreachForm.recipientName}
                      onChange={(e) => setOutreachForm({...outreachForm, recipientName: e.target.value})}
                      placeholder="John Doe"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Their Role</label>
                    <input
                      type="text"
                      value={outreachForm.recipientRole}
                      onChange={(e) => setOutreachForm({...outreachForm, recipientRole: e.target.value})}
                      placeholder="Hiring Manager"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Company</label>
                    <input
                      type="text"
                      value={outreachForm.company}
                      onChange={(e) => setOutreachForm({...outreachForm, company: e.target.value})}
                      placeholder="Acme Inc"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Target Role</label>
                    <input
                      type="text"
                      value={outreachForm.targetRole}
                      onChange={(e) => setOutreachForm({...outreachForm, targetRole: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Background</label>
                  <input
                    type="text"
                    value={outreachForm.yourBackground}
                    onChange={(e) => setOutreachForm({...outreachForm, yourBackground: e.target.value})}
                    placeholder="Full stack development, React, Node.js"
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  />
                </div>
                <button
                  onClick={generateOutreach}
                  disabled={isGenerating}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate {outreachType === 'followup' ? 'Follow-up' : outreachType}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Message</h2>
                {outreachOutput && (
                  <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[350px]">
                {outreachOutput ? (
                  <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">{outreachOutput}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your generated message will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Generator */}
        {activeTab === 'image' && <ImageGenerator />}

        {/* Cover Letter */}
        {activeTab === 'cover' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Cover Letter</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Company *</label>
                    <input
                      type="text"
                      value={coverForm.company}
                      onChange={(e) => setCoverForm({...coverForm, company: e.target.value})}
                      placeholder="Google"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Title *</label>
                    <input
                      type="text"
                      value={coverForm.role}
                      onChange={(e) => setCoverForm({...coverForm, role: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Description</label>
                  <textarea
                    value={coverForm.jobDescription}
                    onChange={(e) => setCoverForm({...coverForm, jobDescription: e.target.value})}
                    placeholder="Paste the job description here..."
                    rows={5}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Experience</label>
                  <textarea
                    value={coverForm.experience}
                    onChange={(e) => setCoverForm({...coverForm, experience: e.target.value})}
                    placeholder="Briefly describe your relevant experience..."
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <button
                  onClick={generateCover}
                  disabled={isGenerating || !coverForm.company || !coverForm.role}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Cover Letter</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Cover Letter</h2>
                {coverOutput && (
                  <div className="flex space-x-2">
                    <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[400px] overflow-y-auto">
                {coverOutput ? (
                  <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">{coverOutput}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your cover letter will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AITools;
