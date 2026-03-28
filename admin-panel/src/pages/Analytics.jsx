import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Users, CreditCard, Activity } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics', { period: '30d' });
      if (response.success) {
        setData(response.data);
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

  const { overview, planStats, statusStats } = data || {};

  // Generate chart data from status stats
  const chartData = [
    { name: 'Free', users: planStats?.free || 0 },
    { name: 'Standard', users: planStats?.standard || 0 },
    { name: 'Unlimited', users: planStats?.unlimited || 0 },
    { name: 'Agency', users: planStats?.agency || 0 }
  ];

  const statusData = [
    { name: 'Active', users: statusStats?.active || 0 },
    { name: 'Suspended', users: statusStats?.suspended || 0 },
    { name: 'Cancelled', users: statusStats?.cancelled || 0 },
    { name: 'Pending', users: statusStats?.pending || 0 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary mt-1">Platform insights and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={overview?.totalUsers || 0}
          trend={`${overview?.growthRate || 0}%`}
          trendUp={overview?.growthRate >= 0}
        />
        <MetricCard
          icon={Activity}
          label="Active Users"
          value={overview?.activeUsers || 0}
          subtitle="Currently active"
        />
        <MetricCard
          icon={TrendingUp}
          label="New Users (30d)"
          value={overview?.newUsersThisPeriod || 0}
          trendUp={overview?.growthRate >= 0}
        />
        <MetricCard
          icon={CreditCard}
          label="Paid Users"
          value={(planStats?.standard || 0) + (planStats?.unlimited || 0) + (planStats?.agency || 0)}
          subtitle="Active subscriptions"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Distribution by Plan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#a0a0b0" />
                <YAxis stroke="#a0a0b0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barCategoryGap="30%">
                <XAxis dataKey="name" stroke="#a0a0b0" />
                <YAxis stroke="#a0a0b0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <rect key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Conversion Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-background-secondary rounded-xl text-center">
            <p className="text-3xl font-bold text-text-primary">
              {overview?.totalUsers > 0
                ? Math.round(((planStats?.standard || 0) + (planStats?.unlimited || 0) + (planStats?.agency || 0)) / overview.totalUsers * 100)
                : 0}%
            </p>
            <p className="text-text-secondary text-sm mt-1">Conversion Rate</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl text-center">
            <p className="text-3xl font-bold text-purple-400">
              {planStats?.agency || 0}
            </p>
            <p className="text-text-secondary text-sm mt-1">Agency Plans</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl text-center">
            <p className="text-3xl font-bold text-pink-400">
              {planStats?.unlimited || 0}
            </p>
            <p className="text-text-secondary text-sm mt-1">Unlimited Plans</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl text-center">
            <p className="text-3xl font-bold text-blue-400">
              {planStats?.standard || 0}
            </p>
            <p className="text-text-secondary text-sm mt-1">Standard Plans</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendUp, subtitle }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-text-secondary text-sm">{label}</p>
        <Icon className="w-5 h-5 text-accent-primary" />
      </div>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
      {trend && (
        <p className={`text-sm mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? '+' : ''}{trend}
        </p>
      )}
      {subtitle && (
        <p className="text-text-secondary text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}
