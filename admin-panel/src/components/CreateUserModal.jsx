import { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function CreateUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'free',
    status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleGenerate = () => {
    const gen = generatePassword();
    setForm((prev) => ({ ...prev, password: gen }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/create-user', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        plan: form.plan,
        status: form.status
      });

      if (response.success) {
        setSuccess('User created successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(response.message || 'Failed to create user.');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-primary/20">
              <UserPlus className="w-5 h-5 text-accent-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Create New User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-text-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <p className="text-green-400 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Enter password"
                className="flex-1 px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-secondary hover:text-text-primary transition-all"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-3 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-secondary hover:text-accent-primary transition-all"
                title="Generate strong password"
                disabled={loading}
              >
                <span className="text-xs font-medium">Generate</span>
              </button>
            </div>
          </div>

          {/* Plan + Status row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Plan</label>
              <select
                value={form.plan}
                onChange={handleChange('plan')}
                className="w-full px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                disabled={loading}
              >
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="unlimited">Unlimited</option>
                <option value="agency">Agency</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={handleChange('status')}
                className="w-full px-4 py-2.5 bg-background-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-glass-border rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-accent-primary text-white font-medium rounded-xl hover:bg-accent-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
