import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Bell,
  Shield,
  Mail,
  LogOut,
  Save,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function Settings() {
  const { admin, logout } = useAuth();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) return;

    setBroadcastLoading(true);
    setBroadcastStatus(null);

    try {
      const response = await api.post('/admin/broadcast', {
        subject: broadcastSubject,
        message: broadcastMessage,
        target: 'all'
      });
      if (response.success) {
        setBroadcastStatus({ type: 'success', message: 'Broadcast sent successfully!' });
        setBroadcastSubject('');
        setBroadcastMessage('');
      }
    } catch (error) {
      setBroadcastStatus({ type: 'error', message: 'Failed to send broadcast' });
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your admin account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Profile */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Admin Profile</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-xl font-semibold text-text-primary">{admin?.name || 'Admin'}</p>
                  <p className="text-text-secondary">{admin?.email}</p>
                  <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                    admin?.role === 'superadmin'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {admin?.role}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">Last Login</p>
                  <p className="text-text-primary font-medium">
                    {admin?.lastLogin
                      ? new Date(admin.lastLogin).toLocaleString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="p-4 bg-background-secondary rounded-xl">
                  <p className="text-text-secondary text-sm">Account Created</p>
                  <p className="text-text-primary font-medium">
                    {admin?.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Section */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Send Announcement</h3>
            </div>

            {broadcastStatus && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                broadcastStatus.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {broadcastStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{broadcastStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Announcement subject..."
                  className="w-full px-4 py-3 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write your announcement message..."
                  rows={5}
                  className="w-full px-4 py-3 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={broadcastLoading || !broadcastSubject || !broadcastMessage}
                className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {broadcastLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to All Users
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Info */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-glass-border">
                <span className="text-text-secondary text-sm">Role</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  admin?.role === 'superadmin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {admin?.role}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-glass-border">
                <span className="text-text-secondary text-sm">Status</span>
                <span className="flex items-center gap-1.5 text-green-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary text-sm">Token Expiry</span>
                <span className="text-text-primary text-sm">24 hours</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Audit Logs</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all">
                <User className="w-4 h-4" />
                <span className="text-sm">Manage Admins</span>
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
