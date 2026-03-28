import { Bot, Zap, TrendingUp, Target, FileText, MessageSquare, ArrowRight, Plus, Clock, Sparkles, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Applications', value: '0', icon: FileText, color: 'from-blue-500 to-blue-600', trend: '+0 this week' },
    { label: 'Interviews Scheduled', value: '0', icon: Target, color: 'from-amber-500 to-amber-600', trend: 'No upcoming' },
    { label: 'Offers Received', value: '0', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', trend: 'Keep going!' },
    { label: 'AI Credits', value: '10', icon: Zap, color: 'from-violet-500 to-violet-600', trend: '/ 10 remaining' },
  ];

  const quickActions = [
    { title: 'Add Application', desc: 'Track a new job opportunity', icon: Plus, path: '/applications', color: 'from-blue-500/20 to-violet-500/20' },
    { title: 'Cover Letter', desc: 'Generate with AI', icon: FileText, path: '/ai-tools', color: 'from-violet-500/20 to-pink-500/20' },
    { title: 'Answer Generator', desc: 'Interview prep AI', icon: MessageSquare, path: '/ai-tools', color: 'from-amber-500/20 to-orange-500/20' },
    { title: 'Cold Outreach', desc: 'LinkedIn & Email', icon: Mail, path: '/ai-tools', color: 'from-emerald-500/20 to-teal-500/20' },
  ];

  const recentActivity = [];

  const aiFeatures = [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-gray-400">Here's what's happening with your job search today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card glass-card-hover p-5 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{stat.trend}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary-light" />
                <span>Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="p-4 rounded-xl bg-gradient-to-br border border-white/10 hover:border-primary/30 transition-all duration-300 text-left group"
                    style={{ background: `linear-gradient(135deg, rgba(18, 18, 26, 0.8), ${action.color})` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <action.icon className="w-5 h-5 text-primary-light" />
                    </div>
                    <h3 className="text-white font-semibold mb-1 flex items-center space-x-2">
                      <span>{action.title}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="glass-card p-6 mt-6">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-accent-light" />
                <span>AI Features</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {aiFeatures.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => navigate('/ai-tools')}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent/30 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-accent-light" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        feature.badge === 'New' ? 'bg-emerald-500/20 text-emerald-400' :
                        feature.badge === 'Popular' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-violet-500/20 text-violet-400'
                      }`}>
                        {feature.badge}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-400">{feature.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Activity & Profile */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-light" />
                <span>Recent Activity</span>
              </h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-500 mt-1">Start by adding an application</p>
                </div>
              )}
            </div>

            {/* Profile Summary */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Getting Started */}
            <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Get Started</h3>
              <p className="text-sm text-gray-400 mb-4">
                Track your job applications and let AI help you craft the perfect resume and cover letter.
              </p>
              <button
                onClick={() => navigate('/applications')}
                className="gradient-btn w-full py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Application</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
