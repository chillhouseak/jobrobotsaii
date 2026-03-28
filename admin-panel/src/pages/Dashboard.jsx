import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  FileText,
  Video
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics', { period: '30d' });
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const { overview, planStats, statusStats, recentSignups } = analytics || {};

  const planData = [
    { name: 'Free', value: planStats?.free || 0 },
    { name: 'Standard', value: planStats?.standard || 0 },
    { name: 'Unlimited', value: planStats?.unlimited || 0 },
    { name: 'Agency', value: planStats?.agency || 0 }
  ];

  const statusData = [
    { name: 'Active', value: statusStats?.active || 0 },
    { name: 'Suspended', value: statusStats?.suspended || 0 },
    { name: 'Cancelled', value: statusStats?.cancelled || 0 },
    { name: 'Pending', value: statusStats?.pending || 0 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Overview of your platform</p>
        </div>
        <select defaultValue="30d" className="px-4 py-2 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          icon={Users}
          trend={overview?.growthRate > 0 ? '+' : ''}
          trendValue={`${overview?.growthRate || 0}%`}
          trendUp={overview?.growthRate >= 0}
        />
        <StatCard
          title="Active Users"
          value={overview?.activeUsers || 0}
          icon={UserCheck}
          subtitle={`of ${overview?.totalUsers || 0} total`}
        />
        <StatCard
          title="New Users (30d)"
          value={overview?.newUsersThisPeriod || 0}
          icon={TrendingUp}
          trendUp={overview?.growthRate >= 0}
        />
        <StatCard
          title="Total Revenue"
          value="$0"
          icon={CreditCard}
          subtitle="Estimated MRR"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Plan Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {planData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-text-secondary">{entry.name}</span>
                <span className="text-sm font-medium text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Status */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#a0a0b0" />
                <YAxis stroke="#a0a0b0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Signups</h3>
          <Activity className="w-5 h-5 text-text-secondary" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups?.map((user) => (
                <tr key={user._id} className="border-b border-glass-border/50 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">{user.name || 'N/A'}</p>
                        <p className="text-text-secondary text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.plan === 'agency' ? 'bg-purple-500/20 text-purple-400' :
                      user.plan === 'unlimited' ? 'bg-pink-500/20 text-pink-400' :
                      user.plan === 'standard' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-text-secondary">
                    No recent signups
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat icon={Bot} label="Total AI Credits" value={overview?.totalUsers * 10 || 0} />
        <QuickStat icon={FileText} label="Resume Generations" value={0} />
        <QuickStat icon={Video} label="Interview Sessions" value={0} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendValue, trendUp, subtitle }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-text-secondary text-xs mt-1">{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-medium">{trend}{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-accent-primary/10">
          <Icon className="w-6 h-6 text-accent-primary" />
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 glass rounded-xl">
      <div className="p-3 rounded-xl bg-accent-secondary/10">
        <Icon className="w-5 h-5 text-accent-secondary" />
      </div>
      <div>
        <p className="text-text-secondary text-sm">{label}</p>
        <p className="text-lg font-semibold text-text-primary">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
