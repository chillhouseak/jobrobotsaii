import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ExternalLink, Trash2, Edit2, Calendar, MapPin, DollarSign, X, Loader2, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const statuses = [
  { key: 'saved', label: 'Saved', color: 'bg-slate-500' },
  { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { key: 'hr', label: 'HR Contact', color: 'bg-violet-500' },
  { key: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { key: 'final', label: 'Final Round', color: 'bg-pink-500' },
  { key: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company: '', role: '', link: '', status: 'saved', appliedDate: '', salary: '', location: '', notes: ''
  });

  // Load applications from backend on mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getApplications();
      if (res.success) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (app = null) => {
    if (app) {
      setFormData({
        company: app.company || '',
        role: app.role || '',
        link: app.link || app.url || '',
        status: app.status || 'saved',
        appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : '',
        salary: app.salary || '',
        location: app.location || '',
        notes: app.notes || '',
      });
      setEditingApp(app);
    } else {
      setFormData({ company: '', role: '', link: '', status: 'saved', appliedDate: '', salary: '', location: '', notes: '' });
      setEditingApp(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingApp) {
        // Update existing
        const res = await apiService.updateApplication(editingApp._id, formData);
        if (res.success) {
          setApplications(prev => prev.map(app => app._id === editingApp._id ? { ...app, ...formData } : app));
        }
      } else {
        // Create new
        const res = await apiService.createApplication(formData);
        if (res.success) {
          setApplications(prev => [res.data.application, ...prev]);
        }
      }
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save application');
    }
  };

  const deleteApp = async (app) => {
    if (!confirm(`Delete application for ${app.company} — ${app.role}?`)) return;
    try {
      const res = await apiService.deleteApplication(app._id);
      if (res.success) {
        setApplications(prev => prev.filter(a => a._id !== app._id));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete application');
    }
  };

  const filteredApps = applications.filter(app =>
    (app.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAppsByStatus = (status) => filteredApps.filter(app => app.status === status);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Applications</h1>
            <p className="text-gray-400 text-sm">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => openModal()}
            className="gradient-btn px-4 py-2.5 rounded-xl text-white font-medium text-sm flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Kanban Board */
          <div className="flex gap-4 overflow-x-auto pb-6">
            {statuses.map((status) => (
              <div
                key={status.key}
                className="flex-shrink-0 w-72"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`}></div>
                    <span className="text-sm font-medium text-white">{status.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {getAppsByStatus(status.key).length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {getAppsByStatus(status.key).map((app) => (
                    <div
                      key={app._id}
                      className="glass-card p-4 hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-sm">
                          {(app.company || '?').charAt(0)}
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(app)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteApp(app)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1">{app.role}</h3>
                      <p className="text-gray-400 text-xs mb-3">{app.company}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        {app.location && (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{app.location}</span>
                          </div>
                        )}
                        {app.salary && (
                          <div className="flex items-center space-x-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{app.salary}</span>
                          </div>
                        )}
                        {app.appliedDate && (
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="mt-3 flex items-center space-x-1 text-xs text-primary-light hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Job</span>
                        </a>
                      )}
                    </div>
                  ))}
                  {getAppsByStatus(status.key).length === 0 && (
                    <div className="h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                      <p className="text-xs text-gray-500">No applications</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                {editingApp ? 'Edit Application' : 'Add Application'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Company *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Link</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  >
                    {statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Applied Date</label>
                  <input
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    placeholder="$100k - $150k"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Remote, NYC, etc."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm resize-none"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gradient-btn py-2.5 rounded-xl text-white font-medium"
                >
                  {editingApp ? 'Update' : 'Add'} Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Applications;
