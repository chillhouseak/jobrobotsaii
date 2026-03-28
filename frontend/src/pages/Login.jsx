import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Eye, EyeOff, ArrowRight, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { login, error, clearError } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const features = [
    { icon: Sparkles, title: 'AI-Powered Tools', desc: 'Generate cover letters, interview answers, and outreach messages instantly' },
    { icon: Target, title: 'Smart Tracking', desc: 'Track every application with our intelligent kanban board' },
    { icon: TrendingUp, title: 'Analytics', desc: 'Get insights into your job search performance and trends' },
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#fafbfc]'}`}>
      {/* Background orbs - Dark Mode */}
      {isDark && (
        <>
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </>
      )}

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      ></div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-12">
          {/* Logo */}
          <div className="flex items-center space-x-3">
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
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your AI-Powered Career Assistant</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className={`text-5xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Automate Your
              <br />
              <span className="gradient-text">Job Search</span>
              <br />
              With AI
            </h2>
            <p className={`text-lg max-w-md leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Let intelligent robots handle the tedious parts of your job hunt while you focus on
              what matters — landing your dream role.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDark
                    ? 'bg-white/5 border border-white/10 group-hover:border-primary/50'
                    : 'bg-gray-100 border border-gray-200 group-hover:border-primary/50'
                }`}>
                  <feature.icon className="w-6 h-6 text-primary-light" />
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full">
          <div className={`p-8 md:p-10 animate-glow ${isDark ? 'bg-white/[0.05] backdrop-blur-xl border border-white/10' : 'bg-white border border-black/10 shadow-xl'}`} style={{ borderRadius: '16px' }}>
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Zap className="w-2 h-2 text-[#0a0a0f]" />
                </div>
              </div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                JobRobots <span className="gradient-text">AI</span>
              </h1>
            </div>

            <div className="mb-8">
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Get Started</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Enter your email and password to access your AI job search assistant</p>
            </div>

            {/* Error message */}
            {(errors.email || errors.password || error) && (
              <div className={`mb-6 p-4 flex items-center space-x-3 ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`} style={{ borderRadius: '12px' }}>
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {errors.email || errors.password || error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                    isDark
                      ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/8'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white'
                  }`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className={`w-4 h-4 rounded border accent-primary ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
                  />
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Remember me</span>
                </label>
                <button
                  type="button"
                  className={`transition-colors ${isDark ? 'text-primary-light hover:text-primary' : 'text-primary hover:text-primary-dark'}`}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="gradient-btn w-full py-3.5 px-6 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={`flex items-center my-8 ${isDark ? '' : ''}`}>
              <div className={`flex-1 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}></div>
              <span className={`px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>or continue with</span>
              <div className={`flex-1 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}></div>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                  : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700'
              }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Google</span>
              </button>
              <button className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                  : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm">GitHub</span>
              </button>
            </div>

            {/* Info text */}
            <p className={`text-center mt-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              New user? Just enter your email and password to get started instantly
            </p>
          </div>

          {/* Footer */}
          <p className={`text-center mt-6 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            By signing in, you agree to our{' '}
            <button className={`${isDark ? 'text-primary-light hover:underline' : 'text-primary hover:underline'}`}>Terms of Service</button>
            {' '}and{' '}
            <button className={`${isDark ? 'text-primary-light hover:underline' : 'text-primary hover:underline'}`}>Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
