import { Gift } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Bonuses = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-space-900 via-purple-900/20 to-space-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Exclusive Bonuses
              </h1>
            </div>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Free resources to help you land your dream job faster
          </p>
        </div>

        {/* Empty State */}
        <div className={`text-center py-16 rounded-2xl ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'
        }`}>
          <Gift className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Bonuses Available
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Bonus resources will appear here when available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Bonuses;
