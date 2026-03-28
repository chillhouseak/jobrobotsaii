import { useState } from 'react';
import { Target, Calendar, TrendingUp, CheckCircle2, Loader2, RefreshCw, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useTheme } from '../context/ThemeContext';

const GoalTracker = () => {
  const { isDark } = useTheme();
  const [goal, setGoal] = useState('');
  const [targetDays, setTargetDays] = useState(60);
  const [currentProgress, setCurrentProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [expandedPhases, setExpandedPhases] = useState({});

  const generatePlan = async () => {
    if (!goal.trim()) return;

    setIsGenerating(true);
    setError('');
    setPlan(null);

    try {
      const response = await apiService.generateGoalTracker(goal.trim(), targetDays, currentProgress.trim() || null);
      if (response.success) {
        setPlan(response.data);
        // Expand all phases by default
        const initialExpanded = {};
        response.data.phases?.forEach((_, i) => { initialExpanded[i] = true; });
        setExpandedPhases(initialExpanded);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate plan');
    }

    setIsGenerating(false);
  };

  const togglePhase = (index) => {
    setExpandedPhases(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const copyPlan = () => {
    if (!plan) return;
    const text = `
Goal: ${plan.goal}
Target: ${plan.targetDays} days
Days Remaining: ${plan.daysRemaining}

PHASES:
${plan.phases?.map((p, i) => `${i + 1}. ${p.phase} (${p.days})
Tasks: ${p.tasks?.join(', ')}
Milestone: ${p.milestone}`).join('\n\n')}

WEEKLY TARGETS:
${plan.weeklyTargets?.join('\n')}

DAILY ACTIONS:
${plan.dailyActions?.join('\n')}

SUCCESS METRICS:
${plan.successMetrics?.join('\n')}

SUGGESTIONS:
${plan.suggestions?.join('\n')}
`.trim();
    navigator.clipboard.writeText(text);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <Target className="w-6 h-6 text-primary-light" />
            <span>AI Goal Tracker</span>
          </h1>
          <p className="text-gray-400">Set your job search goal and get an AI-powered action plan</p>
        </div>

        {/* Input Section */}
        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
          {/* Goal Input */}
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Your Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Get a software engineering job in 60 days"
              className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Target Days */}
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Target Days: <span className="text-primary-light font-bold">{targetDays}</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={7}
                max={180}
                value={targetDays}
                onChange={(e) => setTargetDays(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className={`text-sm font-medium w-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>{targetDays}d</span>
            </div>
          </div>

          {/* Current Progress */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Progress <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <textarea
              value={currentProgress}
              onChange={(e) => setCurrentProgress(e.target.value)}
              placeholder="e.g. I have updated my resume, started applying to jobs, networking on LinkedIn..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePlan}
            disabled={isGenerating || !goal.trim()}
            className="gradient-btn w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating your plan...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Generate Goal Plan</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Generated Plan */}
        {plan && (
          <div>
            {/* Plan Header */}
            <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.goal}</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`flex items-center space-x-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{plan.targetDays} days target</span>
                    </span>
                    <span className={`flex items-center space-x-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4" />
                      <span>{plan.daysRemaining} days remaining</span>
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={generatePlan}
                    disabled={isGenerating}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={copyPlan}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.max(5, 100 - (plan.daysRemaining / plan.targetDays) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Targets */}
            {plan.weeklyTargets?.length > 0 && (
              <div className={`p-6 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <TrendingUp className="w-5 h-5 text-primary-light" />
                  <span>Weekly Targets</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan.weeklyTargets.map((target, i) => (
                    <div key={i} className={`flex items-start space-x-2 p-3 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                      <CheckCircle2 className="w-4 h-4 text-primary-light mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Actions */}
            {plan.dailyActions?.length > 0 && (
              <div className={`p-6 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Award className="w-5 h-5 text-accent" />
                  <span>Daily Actions</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {plan.dailyActions.map((action, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phases */}
            {plan.phases?.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Action Phases</h3>
                {plan.phases.map((phase, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}
                  >
                    <button
                      onClick={() => togglePhase(i)}
                      className="w-full p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light text-sm font-bold">
                          {i + 1}
                        </div>
                        <div className="text-left">
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{phase.phase}</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{phase.days} — {phase.milestone}</p>
                        </div>
                      </div>
                      {expandedPhases[i] ? (
                        <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                    {expandedPhases[i] && (
                      <div className={`px-4 pb-4 ${isDark ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                        <div className="pt-4 space-y-2">
                          {phase.tasks?.map((task, j) => (
                            <div key={j} className={`flex items-start space-x-2 p-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                              <CheckCircle2 className="w-4 h-4 text-primary-light mt-0.5 flex-shrink-0" />
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Success Metrics */}
            {plan.successMetrics?.length > 0 && (
              <div className={`p-6 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="w-5 h-5 text-primary-light" />
                  <span>Success Metrics</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan.successMetrics.map((metric, i) => (
                    <div key={i} className={`flex items-start space-x-2 p-3 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {plan.suggestions?.length > 0 && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Suggestions</h3>
                <div className="space-y-2">
                  {plan.suggestions.map((suggestion, i) => (
                    <p key={i} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!plan && !isGenerating && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Set Your Goal</h3>
            <p className={`max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter your job search goal above and get a personalized AI-powered action plan with phases, weekly targets, and daily actions
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GoalTracker;
