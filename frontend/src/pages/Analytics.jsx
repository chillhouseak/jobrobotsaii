import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const STATUS_META = [
  { key: 'saved',     label: 'Saved',      color: 'bg-slate-500' },
  { key: 'applied',   label: 'Applied',    color: 'bg-blue-500' },
  { key: 'hr',        label: 'HR Contact', color: 'bg-violet-500' },
  { key: 'interview', label: 'Interview',  color: 'bg-amber-500' },
  { key: 'final',     label: 'Final Round',color: 'bg-pink-500' },
  { key: 'offer',     label: 'Offer',      color: 'bg-emerald-500' },
  { key: 'rejected',  label: 'Rejected',   color: 'bg-red-500' },
];

const Analytics = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getApplications({ limit: 500 });
        if (res.success) setApplications(res.data.applications);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────
  const total = applications.length;
  const responded = applications.filter(a =>
    ['hr', 'interview', 'final', 'offer', 'rejected'].includes(a.status)
  ).length;
  const interviewed = applications.filter(a =>
    ['interview', 'final', 'offer'].includes(a.status)
  ).length;

  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;

  // Average days from appliedDate to today for responded apps
  const responseTimes = applications
    .filter(a => a.appliedDate && ['hr', 'interview', 'final', 'offer', 'rejected'].includes(a.status))
    .map(a => Math.max(0, Math.floor((Date.now() - new Date(a.appliedDate)) / 86400000)));
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length)
    : 0;

  const stats = [
    { label: 'Total Applied',       value: String(total),                  icon: Users },
    { label: 'Response Rate',       value: `${responseRate}%`,             icon: TrendingUp },
    { label: 'Interview Rate',      value: `${interviewRate}%`,            icon: Target },
    { label: 'Avg. Response Time',  value: `${avgResponseTime} days`,      icon: BarChart3 },
  ];

  // ── Applications by status ─────────────────────────────────────────
  const applicationsByStatus = STATUS_META.map(s => ({
    ...s,
    count: applications.filter(a => a.status === s.key).length,
  }));

  // ── Weekly chart (last 7 calendar days) ───────────────────────────
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = applications.filter(a => {
      const created = new Date(a.createdAt);
      return (
        created.getFullYear() === d.getFullYear() &&
        created.getMonth() === d.getMonth() &&
        created.getDate() === d.getDate()
      );
    }).length;
    return { day: dayLabel, applications: count };
  });

  const maxApps = Math.max(...weeklyData.map(d => d.applications), 1);

  // ── Top companies ──────────────────────────────────────────────────
  const companyCounts = applications.reduce((acc, a) => {
    if (a.company) acc[a.company] = (acc[a.company] || 0) + 1;
    return acc;
  }, {});
  const companies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // ── Funnel ─────────────────────────────────────────────────────────
  const funnelStages = [
    { label: 'Applied',    count: applications.filter(a => a.status !== 'saved').length },
    { label: 'Responded',  count: responded },
    { label: 'Interview',  count: interviewed },
    { label: 'Offer',      count: applications.filter(a => a.status === 'offer').length },
  ];
  const funnelMax = funnelStages[0]?.count || 1;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Track your job search performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary-light" />
                </div>
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
              ) : (
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              )}
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Applications Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Applications This Week</h2>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-end justify-between space-x-2 h-40">
                {weeklyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">{data.applications > 0 ? data.applications : ''}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary/60 to-primary/20 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(data.applications / maxApps) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">By Status</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {applicationsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-sm text-gray-300">{item.label}</span>
                    <span className="text-sm text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Companies */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Top Companies</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : companies.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {companies.map((company, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-sm">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.count} application{company.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funnel Analysis */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Funnel Analysis</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : funnelStages[0].count === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Add applications to see your funnel</p>
            ) : (
              <div className="space-y-3">
                {funnelStages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="w-24 text-sm text-gray-400 text-right">{stage.label}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary/60 to-accent/60 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((stage.count / funnelMax) * 100, stage.count > 0 ? 4 : 0)}%` }}
                      >
                        {stage.count > 0 && (
                          <span className="text-xs text-white font-medium">{stage.count}</span>
                        )}
                      </div>
                    </div>
                    <span className="w-8 text-sm text-white font-medium">{stage.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
