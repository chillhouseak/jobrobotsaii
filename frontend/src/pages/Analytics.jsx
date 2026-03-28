import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import Layout from '../components/Layout';

const Analytics = () => {
  const stats = [
    { label: 'Total Applied', value: '0', change: '0', up: true, icon: Users },
    { label: 'Response Rate', value: '0%', change: '0%', up: true, icon: TrendingUp },
    { label: 'Interview Rate', value: '0%', change: '0%', up: true, icon: Target },
    { label: 'Avg. Response Time', value: '0 days', change: '0', up: true, icon: BarChart3 },
  ];

  const applicationsByStatus = [
    { status: 'Saved', count: 0, color: 'bg-slate-500' },
    { status: 'Applied', count: 0, color: 'bg-blue-500' },
    { status: 'HR Contact', count: 0, color: 'bg-violet-500' },
    { status: 'Interview', count: 0, color: 'bg-amber-500' },
    { status: 'Offer', count: 0, color: 'bg-emerald-500' },
    { status: 'Rejected', count: 0, color: 'bg-red-500' },
  ];

  const weeklyData = [
    { day: 'Mon', applications: 0 },
    { day: 'Tue', applications: 0 },
    { day: 'Wed', applications: 0 },
    { day: 'Thu', applications: 0 },
    { day: 'Fri', applications: 0 },
    { day: 'Sat', applications: 0 },
    { day: 'Sun', applications: 0 },
  ];

  const maxApps = Math.max(...weeklyData.map(d => d.applications), 1);

  const companies = [];

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
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Applications Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Applications This Week</h2>
            <div className="flex items-end justify-between space-x-2 h-40">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-primary/40 to-primary/10 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(data.applications / maxApps) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">By Status</h2>
            <div className="space-y-3">
              {applicationsByStatus.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm text-gray-300">{item.status}</span>
                  <span className="text-sm text-white font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Companies */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Top Companies</h2>
            {companies.length === 0 ? (
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
                      <p className="text-xs text-gray-500">{company.count} application(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funnel Analysis */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Funnel Analysis</h2>
            <p className="text-gray-500 text-sm text-center py-8">Add applications to see your funnel</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
