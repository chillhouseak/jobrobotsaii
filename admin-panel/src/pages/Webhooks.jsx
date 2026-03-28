import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Webhook,
  Plus,
  Trash2,
  Edit3,
  Play,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [showSecret, setShowSecret] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: ['payment.completed']
  });
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/webhooks');
      if (response.success) {
        setWebhooks(response.data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingWebhook) {
        await api.put(`/admin/webhooks/${editingWebhook._id}`, formData);
      } else {
        await api.post('/admin/webhooks', formData);
      }
      fetchWebhooks();
      closeModal();
    } catch (error) {
      console.error('Failed to save webhook:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await api.delete(`/admin/webhooks/${id}`);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleToggle = async (webhook) => {
    try {
      await api.put(`/admin/webhooks/${webhook._id}`, {
        isActive: !webhook.isActive
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const response = await api.post(`/admin/webhooks/${id}/test`);
      alert(response.message);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to test webhook:', error);
    } finally {
      setTestingId(null);
    }
  };

  const handleRegenerateSecret = async (id) => {
    try {
      const response = await api.post(`/admin/webhooks/${id}/regenerate`);
      setShowSecret({ id, secret: response.data.secret });
    } catch (error) {
      console.error('Failed to regenerate secret:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openEditModal = (webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWebhook(null);
    setFormData({ name: '', url: '', events: ['payment.completed'] });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Webhook Management</h1>
          <p className="text-text-secondary mt-1">Manage IPN webhooks for payment processing</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Webhook className="w-16 h-16 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">No Webhooks Configured</h3>
          <p className="text-text-secondary mt-2">Add a webhook to receive payment notifications</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-all"
          >
            Add Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook._id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    webhook.isActive ? 'bg-green-500/20' : 'bg-gray-500/20'
                  }`}>
                    {webhook.isActive ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-text-primary">{webhook.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        webhook.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mt-1 font-mono">{webhook.url}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-text-secondary text-sm">
                        Triggered: {webhook.triggerCount} times
                      </span>
                      <span className={`text-sm ${
                        webhook.lastStatus === 'success' ? 'text-green-400' :
                        webhook.lastStatus === 'failed' ? 'text-red-400' :
                        'text-text-secondary'
                      }`}>
                        Last: {webhook.lastStatus || 'Never'}
                      </span>
                      {webhook.lastTriggered && (
                        <span className="text-text-secondary text-sm">
                          {new Date(webhook.lastTriggered).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(webhook)}
                    className={`p-2 rounded-lg transition-all ${
                      webhook.isActive
                        ? 'hover:bg-yellow-500/10 text-yellow-400'
                        : 'hover:bg-green-500/10 text-green-400'
                    }`}
                    title={webhook.isActive ? 'Disable' : 'Enable'}
                  >
                    {webhook.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTest(webhook._id)}
                    disabled={testingId === webhook._id}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all disabled:opacity-50"
                    title="Test Webhook"
                  >
                    {testingId === webhook._id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRegenerateSecret(webhook._id)}
                    className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-all"
                    title="Regenerate Secret"
                  >
                    <Key className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(webhook)}
                    className="p-2 rounded-lg hover:bg-white/10 text-text-secondary transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook._id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secret Modal */}
      {showSecret && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <h3 className="text-lg font-semibold text-text-primary">Webhook Secret</h3>
              <button
                onClick={() => setShowSecret(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-text-secondary text-sm mb-4">
                Copy this secret and store it securely. You won't be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={showSecret.secret}
                  className="flex-1 px-4 py-3 bg-background-secondary border border-glass-border rounded-xl text-text-primary font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(showSecret.secret)}
                  className="p-3 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-lg animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <h3 className="text-lg font-semibold text-text-primary">
                {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Webhook Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Payment Processor IPN"
                  className="w-full px-4 py-3 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-3 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Events
                </label>
                <div className="space-y-2">
                  {['payment.completed', 'payment.failed', 'subscription.created', 'subscription.upgraded', 'subscription.cancelled'].map((event) => (
                    <label key={event} className="flex items-center gap-3 p-3 bg-background-secondary rounded-xl cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, events: [...formData.events, event] });
                          } else {
                            setFormData({ ...formData, events: formData.events.filter(e => e !== event) });
                          }
                        }}
                        className="w-4 h-4 rounded border-glass-border text-accent-primary focus:ring-accent-primary"
                      />
                      <span className="text-text-primary text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-background-secondary text-text-primary font-medium rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : (editingWebhook ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
