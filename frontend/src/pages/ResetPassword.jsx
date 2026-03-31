import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Eye, EyeOff, ArrowRight, Zap, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';

const ResetPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
    }
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('[ResetPassword] handleSubmit called');
    console.log('[ResetPassword] token:', token ? 'present' : 'MISSING');
    console.log('[ResetPassword] password length:', password.length);

    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Call reset-password API directly, bypassing apiService to debug
      const url = `${import.meta.env.VITE_API_URL || 'https://jobrobotsaii.vercel.app/api'}/auth/reset-password`;
      console.log('[ResetPassword] Calling:', 'POST', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      console.log('[ResetPassword] Response:', response.status, data);
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('[ResetPassword] Error:', err);
      setError(err.message || 'Something went wrong. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#fafbfc]'}`}>
      {isDark && (
        <>
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </>
      )}

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        <div className={`p-8 md:p-10 animate-glow ${isDark ? 'bg-white/[0.05] backdrop-blur-xl border border-white/10' : 'bg-white border border-black/10 shadow-xl'}`} style={{ borderRadius: '16px' }}>

          {/* Logo & Name */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#0a0a0f]" />
              </div>
            </div>
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                JobRobots <span className="gradient-text">AI</span>
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Set New Password</p>
            </div>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Password Reset!</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your password has been successfully reset. You can now login with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="gradient-btn w-full py-3.5 px-6 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2"
              >
                <span>Login with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className={`mb-6 p-4 flex items-start space-x-3 ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`} style={{ borderRadius: '12px' }}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        placeholder="Enter new password"
                        className={`w-full pl-12 pr-12 py-3 rounded-xl text-sm transition-all ${
                          isDark
                            ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                            : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className={`mt-1.5 text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        placeholder="Confirm new password"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all ${
                          isDark
                            ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                            : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className={`mt-1.5 text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="gradient-btn w-full py-3.5 px-6 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner"></div>
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className={`text-center mt-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Remember your password?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="text-primary hover:underline font-medium"
                >
                  Back to Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
