import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Bot,
  FileText,
  Video,
  Zap,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Minus,
  Edit3
} from 'lucide-react';

export default function AIUsage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [heavyUsers, setHeavyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [editingCredits, setEditingCredits] = useState(null);
  const [newCredits, setNewCredits] = useState('');

  useEffect(() => {
    fetchAIUsage();
  }, [pagination.page]);

  const fetchAIUsage = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/ai-usage', {
        page: pagination.page,
        limit: 15
      });
      if (response.success) {
        setUsers(response.data.users);
        setStats(response.data.stats);
        setHeavyUsers(response.data.heavyUsers);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (userId) => {
    const credits = parseInt(newCredits);
    if (isNaN(credits) || credits < 0) return;

    try {
      const response = await api.put(`/admin/ai-usage/${userId}`, { aiCredits: credits });
      if (response.success) {
        fetchAIUsage();
        setEditingCredits(null);
        setNewCredits('');
      }
    } catch (error) {
      console.error('Failed to update credits:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Usage Control</h1>
        <p className="text-text-secondary mt-1">Monitor and manage AI resource consumption</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Total Credits Used"
          value={stats.totalCredits || 0}
          color="text-yellow-400"
          bg="bg-yellow-400/20"
        />
        <StatCard
          icon={Bot}
          label="Avg Credits/User"
          value={Math.round(stats.avgCredits || 0)}
          color="text-blue-400"
          bg="bg-blue-400/20"
        />
        <StatCard
          icon={FileText}
          label="Resume Generations"
          value={stats.totalResumes || 0}
          color="text-purple-400"
          bg="bg-purple-400/20"
        />
        <StatCard
          icon={Video}
          label="Interview Sessions"
          value={stats.totalInterviews || 0}
          color="text-pink-400"
          bg="bg-pink-400/20"
        />
      </div>

      {/* Heavy Users Alert */}
      {heavyUsers.length > 0 && (
        <div className="glass rounded-2xl p-6 border-l-4 border-yellow-500">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary">Heavy Users</h3>
              <p className="text-text-secondary text-sm mt-1">
                Users with highest AI consumption this period
              </p>
              <div className="mt-4 space-y-2">
                {heavyUsers.slice(0, 5).map((user, index) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-text-secondary text-sm w-6">#{index + 1}</span>
                      <div>
                        <p className="text-text-primary font-medium">{user.name || user.email}</p>
                        <p className="text-text-secondary text-xs">{user.plan} plan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-yellow-400 font-medium">{user.aiCredits} credits</span>
                      {user.resumeGenerations > 0 && (
                        <span className="text-text-secondary text-sm">{user.resumeGenerations} resumes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary">All Users Usage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Plan</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">AI Credits</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Resumes</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Interviews</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-text-secondary">
                    No usage data available
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-t border-glass-border hover:bg-white/5">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{user.name || 'N/A'}</p>
                          <p className="text-text-secondary text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.plan === 'agency' ? 'bg-purple-500/20 text-purple-400' :
                        user.plan === 'unlimited' ? 'bg-pink-500/20 text-pink-400' :
                        user.plan === 'standard' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {editingCredits === user._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newCredits}
                            onChange={(e) => setNewCredits(e.target.value)}
                            className="w-24 px-3 py-1.5 bg-background-secondary border border-glass-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                            min="0"
                            autoFocus
                          />
                          <button
                            onClick={() => updateCredits(user._id)}
                            className="px-3 py-1.5 bg-accent-primary text-white text-sm rounded-lg hover:bg-accent-primary/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingCredits(null); setNewCredits(''); }}
                            className="px-3 py-1.5 bg-background-secondary text-text-secondary text-sm rounded-lg hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            user.aiCredits > 80 ? 'text-yellow-400' : 'text-text-primary'
                          }`}>
                            {user.aiCredits}
                          </span>
                          {user.plan === 'unlimited' || user.plan === 'agency' ? (
                            <Zap className="w-4 h-4 text-purple-400" />
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-text-secondary">
                      {user.resumeGenerations || 0}
                    </td>
                    <td className="py-4 px-6 text-text-secondary">
                      {user.interviewSessions || 0}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end">
                        {editingCredits !== user._id && (
                          <button
                            onClick={() => {
                              setEditingCredits(user._id);
                              setNewCredits(user.aiCredits.toString());
                            }}
                            className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-accent-primary transition-all"
                            title="Edit Credits"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
            <p className="text-text-secondary text-sm">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}
