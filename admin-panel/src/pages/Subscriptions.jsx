import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
  Zap,
  Building,
  User
} from 'lucide-react';

const PLAN_DETAILS = {
  free: { name: 'Free', icon: User, color: 'text-gray-400', bg: 'bg-gray-400/20' },
  standard: { name: 'Standard', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/20' },
  unlimited: { name: 'Unlimited', icon: Crown, color: 'text-pink-400', bg: 'bg-pink-400/20' },
  agency: { name: 'Agency', icon: Building, color: 'text-purple-400', bg: 'bg-purple-400/20' }
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ planDistribution: {}, estimatedMRR: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ plan: '', status: '' });
  const [selectedSub, setSelectedSub] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [pagination.page, filters]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15, ...filters };
      const response = await api.get('/admin/subscriptions', params);
      if (response.success) {
        setSubscriptions(response.data.subscriptions);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (userId, plan) => {
    try {
      const response = await api.put(`/admin/subscriptions/${userId}`, { plan });
      if (response.success) {
        fetchSubscriptions();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Subscription Management</h1>
        <p className="text-text-secondary mt-1">Manage user plans and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats.planDistribution).map(([plan, count]) => {
          const details = PLAN_DETAILS[plan];
          const Icon = details.icon;
          return (
            <div key={plan} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${details.bg}`}>
                  <Icon className={`w-5 h-5 ${details.color}`} />
                </div>
                <span className="text-2xl font-bold text-text-primary">{count}</span>
              </div>
              <p className="text-text-secondary text-sm">{details.name} Users</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={filters.plan}
            onChange={(e) => { setFilters({ ...filters, plan: e.target.value }); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="unlimited">Unlimited</option>
            <option value="agency">Agency</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Current Plan</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Credits</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Renewal</th>
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
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-text-secondary">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const planDetails = PLAN_DETAILS[sub.plan];
                  const PlanIcon = planDetails.icon;
                  return (
                    <tr key={sub._id} className="border-t border-glass-border hover:bg-white/5">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-medium">
                            {sub.name?.charAt(0)?.toUpperCase() || sub.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{sub.name || 'N/A'}</p>
                            <p className="text-text-secondary text-sm">{sub.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${planDetails.bg}`}>
                          <PlanIcon className={`w-4 h-4 ${planDetails.color}`} />
                          <span className={`text-sm font-medium ${planDetails.color}`}>
                            {planDetails.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 ${
                          sub.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sub.status === 'active' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span className="text-sm capitalize">{sub.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-secondary">
                        {sub.aiCredits}
                      </td>
                      <td className="py-4 px-6 text-text-secondary text-sm">
                        {sub.subscriptionEndDate
                          ? new Date(sub.subscriptionEndDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedSub(sub); setShowModal(true); }}
                            className="px-3 py-1.5 rounded-lg bg-accent-primary/20 text-accent-primary text-sm font-medium hover:bg-accent-primary/30 transition-all"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Manage Plan Modal */}
      {showModal && selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b border-glass-border">
              <h3 className="text-lg font-semibold text-text-primary">Change Subscription Plan</h3>
              <p className="text-text-secondary text-sm mt-1">{selectedSub.email}</p>
            </div>
            <div className="p-6 space-y-3">
              {Object.entries(PLAN_DETAILS).map(([key, details]) => {
                const Icon = details.icon;
                const isCurrent = selectedSub.plan === key;
                return (
                  <button
                    key={key}
                    onClick={() => !isCurrent && updateSubscription(selectedSub._id, key)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-glass-border hover:border-accent-primary hover:bg-accent-primary/5'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${details.bg}`}>
                      <Icon className={`w-6 h-6 ${details.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-text-primary font-medium">{details.name}</p>
                      <p className="text-text-secondary text-sm capitalize">{key} Plan</p>
                    </div>
                    {isCurrent && (
                      <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary text-sm rounded-full">
                        Current
                      </span>
                    )}
                    {!isCurrent && (
                      <ArrowUpCircle className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-6 border-t border-glass-border">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-background-secondary text-text-primary font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
