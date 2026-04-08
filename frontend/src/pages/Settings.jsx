import { useState, useEffect } from 'react';
import { User, Palette, Bell, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Layout from '../components/Layout';
import apiService from '../services/api';

const Settings = () => {
  const { user, setUser } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    skills: '',
    experienceLevel: 'mid',
    targetRole: '',
    phone: '',
    location: '',
    linkedin: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) return;

    setProfileData({
      name: user.name || '',
      email: user.email || '',
      skills: user.skills || '',
      experienceLevel: user.experienceLevel || 'mid',
      targetRole: user.targetRole || '',
      phone: user.phone || '',
      location: user.location || '',
      linkedin: user.linkedin || '',
      bio: user.bio || '',
    });
    setIsLoading(false);

    const fetchUser = async () => {
      try {
        const response = await apiService.getMe();
        if (response.success && response.data.user) {
          const u = response.data.user;
          setProfileData({
            name: u.name || '',
            email: u.email || '',
            skills: u.skills || '',
            experienceLevel: u.experienceLevel || 'mid',
            targetRole: u.targetRole || '',
            phone: u.phone || '',
            location: u.location || '',
            linkedin: u.linkedin || '',
            bio: u.bio || '',
          });
          localStorage.setItem('jobrobots_user', JSON.stringify(u));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const result = await apiService.updateProfile(profileData);
      if (result.success) {
        setSaveSuccess(true);
        setUser(result.data.user);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || 'Failed to save');
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile');
    }

    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'appearance',    label: 'Appearance',     icon: Palette },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
  ];

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
    isDark
      ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary'
      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary'
  }`;

  const cardClass = isDark
    ? 'bg-white/[0.05] border border-white/10'
    : 'bg-white border border-gray-200';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className={`lg:w-64 flex-shrink-0 p-2 rounded-2xl ${cardClass}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className={`p-6 rounded-2xl ${cardClass}`}>
                <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center space-x-4 pb-6 border-b border-white/10">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold">
                        {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium mb-1">Profile Photo</p>
                        <button className="text-sm text-primary-light hover:text-primary">Change photo</button>
                      </div>
                    </div>

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                        <input
                          type="email"
                          value={profileData.email}
                          className={`${inputClass} opacity-60 cursor-not-allowed`}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Phone & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
                        <input
                          type="text"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="+1 234 567 8900"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          placeholder="New York, NY"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Skills</label>
                      <input
                        type="text"
                        value={profileData.skills}
                        onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                        placeholder="React, Node.js, Python..."
                        className={inputClass}
                      />
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Separate skills with commas</p>
                    </div>

                    {/* Experience & Target Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Experience Level</label>
                        <select
                          value={profileData.experienceLevel}
                          onChange={(e) => setProfileData({ ...profileData, experienceLevel: e.target.value })}
                          className={inputClass}
                        >
                          <option value="junior">Junior (0-2 years)</option>
                          <option value="mid">Mid-Level (2-5 years)</option>
                          <option value="senior">Senior (5-10 years)</option>
                          <option value="lead">Lead / Manager (10+ years)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Target Role</label>
                        <input
                          type="text"
                          value={profileData.targetRole}
                          onChange={(e) => setProfileData({ ...profileData, targetRole: e.target.value })}
                          placeholder="Software Engineer"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>LinkedIn URL</label>
                      <input
                        type="url"
                        value={profileData.linkedin}
                        onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className={inputClass}
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gradient-btn px-6 py-2.5 rounded-xl text-white font-medium text-sm flex items-center space-x-2 disabled:opacity-60"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>

                      {saveSuccess && (
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">Saved!</span>
                        </div>
                      )}

                      {saveError && (
                        <div className="flex items-center space-x-1 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{saveError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className={`p-6 rounded-2xl ${cardClass}`}>
                <h2 className="text-lg font-semibold text-white mb-6">Appearance</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Theme is controlled from the sidebar toggle.</p>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className={`p-6 rounded-2xl ${cardClass}`}>
                <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { key: 'email',     label: 'Email Notifications', desc: 'Receive updates about your applications' },
                    { key: 'reminders', label: 'Reminders',           desc: 'Get reminded about follow-ups and interviews' },
                    { key: 'marketing', label: 'Marketing',           desc: 'Tips, tricks, and product updates' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-primary relative cursor-pointer transition-colors">
                        <div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 right-0.5 translate-x-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
