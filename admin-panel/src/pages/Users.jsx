import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CreateUserModal from '../components/CreateUserModal';
import {
  Search,
  UserPlus,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', plan: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 15,
        search,
        ...filters
      };
      const response = await api.get('/admin/users', params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleSuspend = async (userId, suspend) => {
    setActionLoading(userId);
    try {
      const response = await api.put(`/admin/users/${userId}/suspend`, { suspend });
      if (response.success) {
        fetchUsers();
        if (showUserModal && selectedUser._id === userId) {
          setSelectedUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('Failed to suspend user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(userId);
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.success) {
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const viewUser = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      if (response.success) {
        setSelectedUser(response.data.user);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary mt-1">Manage and monitor all users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
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
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Plan</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">AI Credits</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-text-secondary">Joined</th>
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
                    No users found
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
                      <span className={`flex items-center gap-2 ${
                        user.status === 'active' ? 'text-green-400' :
                        user.status === 'suspended' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {user.status === 'active' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                        <span className="text-sm capitalize">{user.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-text-secondary">
                      {user.aiCredits}
                    </td>
                    <td className="py-4 px-6 text-text-secondary text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewUser(user._id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(user._id, true)}
                            disabled={actionLoading === user._id}
                            className="p-2 rounded-lg hover:bg-yellow-500/10 text-text-secondary hover:text-yellow-400 transition-all"
                            title="Suspend User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(user._id, false)}
                            disabled={actionLoading === user._id}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-text-secondary hover:text-green-400 transition-all"
                            title="Reactivate User"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={actionLoading === user._id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              Showing {(pagination.page - 1) * 15 + 1} to {Math.min(pagination.page * 15, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(
                Math.max(0, pagination.page - 3),
                Math.min(pagination.pages, pagination.page + 2)
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    page === pagination.page
                      ? 'bg-accent-primary text-white'
                      : 'hover:bg-white/10 text-text-secondary'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchUsers()}
        />
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-lg animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <h3 className="text-lg font-semibold text-text-primary">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-semibold text-text-primary">{selectedUser.name || 'N/A'}</p>
                  <p className="text-text-secondary">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">Plan</p>
                  <p className="text-text-primary font-medium capitalize">{selectedUser.plan}</p>
                </div>
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">Status</p>
                  <p className={`font-medium capitalize ${
                    selectedUser.status === 'active' ? 'text-green-400' : 'text-red-400'
                  }`}>{selectedUser.status}</p>
                </div>
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">AI Credits</p>
                  <p className="text-text-primary font-medium">{selectedUser.aiCredits}</p>
                </div>
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">Resumes</p>
                  <p className="text-text-primary font-medium">{selectedUser.resumeGenerations || 0}</p>
                </div>
              </div>
              <div className="p-4 bg-background-secondary rounded-xl">
                <p className="text-text-secondary text-sm">Member Since</p>
                <p className="text-text-primary font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-glass-border">
              {selectedUser.status === 'active' ? (
                <button
                  onClick={() => { handleSuspend(selectedUser._id, true); setShowUserModal(false); }}
                  className="flex-1 py-2 px-4 bg-yellow-500/20 text-yellow-400 font-medium rounded-xl hover:bg-yellow-500/30 transition-all"
                >
                  Suspend User
                </button>
              ) : (
                <button
                  onClick={() => { handleSuspend(selectedUser._id, false); setShowUserModal(false); }}
                  className="flex-1 py-2 px-4 bg-green-500/20 text-green-400 font-medium rounded-xl hover:bg-green-500/30 transition-all"
                >
                  Reactivate User
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedUser._id)}
                className="py-2 px-4 bg-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
