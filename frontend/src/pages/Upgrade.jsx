import { useState } from 'react';
import { Crown, Check, Star, Sparkles, Building, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Upgrade = () => {
  const { isDark } = useTheme();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      popular: false,
      description: 'Perfect for job seekers getting started',
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: [
        '50 AI Resume Generations/month',
        '20 AI Interview Practice Sessions',
        'Basic Resume Templates',
        'Email Support',
        '5 Cover Letters/month',
        'Basic Analytics'
      ],
      notIncluded: [
        'Unlimited Generations',
        'Priority Support',
        'Agency Features'
      ]
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      description: 'Most popular for serious job hunters',
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        'Unlimited AI Resume Generations',
        'Unlimited Interview Practice',
        'Premium Templates Library',
        'Priority Email Support',
        'Unlimited Cover Letters',
        'Advanced Analytics',
        'LinkedIn Optimization',
        'Cold Email Templates',
        'Exclusive Guides Access'
      ],
      notIncluded: [
        'White-label Reports',
        'Agency Dashboard'
      ]
    },
    {
      id: 'agency',
      name: 'Agency',
      icon: Building,
      color: 'from-amber-500 to-orange-500',
      popular: false,
      description: 'For HR teams and recruitment agencies',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      features: [
        'Everything in Unlimited',
        'Team Management (up to 10 users)',
        'White-label Reports',
        'API Access',
        'Dedicated Account Manager',
        'Custom Templates',
        'Bulk Processing',
        'Integration Support',
        'Training Sessions',
        'SLA Guarantee'
      ],
      notIncluded: []
    }
  ];

  const getPrice = (plan) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavings = (plan) => {
    const yearlyCost = plan.monthlyPrice * 12;
    const savings = yearlyCost - plan.yearlyPrice;
    return Math.round((savings / yearlyCost) * 100);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-space-900 via-purple-900/20 to-space-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Upgrade Your Career
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Choose Your Plan
          </h1>
          <p className={`text-lg mb-8 max-w-2xl mx-auto ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Unlock your full potential with our powerful AI tools. Start your journey to landing your dream job today.
          </p>

          {/* Billing Toggle */}
          <div className={`inline-flex items-center gap-4 p-1.5 rounded-2xl ${
            isDark ? 'bg-white/5' : 'bg-gray-200'
          }`}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                billingPeriod === 'yearly'
                  ? 'bg-white/20'
                  : 'bg-emerald-500 text-white'
              }`}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                hoveredPlan === plan.id ? 'scale-[1.02]' : ''
              } ${
                plan.popular
                  ? `bg-gradient-to-b ${plan.color} p-[2px]`
                  : isDark
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white border border-black/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-white text-gray-900 text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className={`h-full rounded-3xl ${
                plan.popular ? '' : isDark ? 'bg-space-900' : 'bg-white'
              } p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${getPrice(plan)}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-emerald-400 text-sm mt-1">
                      Save {getSavings(plan)}% with yearly billing
                    </p>
                  )}
                </div>

                <button className={`w-full py-3 rounded-xl font-semibold transition-all mb-6 ${
                  plan.popular
                    ? 'bg-white text-gray-900 hover:shadow-lg'
                    : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg`
                }`}>
                  Get Started
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className={`rounded-3xl p-8 ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-white/10' : 'border-b border-black/10'}>
                  <th className={`text-left py-4 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Feature
                  </th>
                  <th className={`text-center py-4 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Standard
                  </th>
                  <th className={`text-center py-4 px-4 font-semibold bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-xl ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Unlimited
                  </th>
                  <th className={`text-center py-4 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Resume Generations', '50/month', 'Unlimited', 'Unlimited'],
                  ['Interview Practice', '20 sessions', 'Unlimited', 'Unlimited'],
                  ['Cover Letters', '5/month', 'Unlimited', 'Unlimited'],
                  ['Template Library', 'Basic', 'Premium', 'Premium + Custom'],
                  ['Analytics', 'Basic', 'Advanced', 'Advanced + Export'],
                  ['Team Members', '1', '1', 'Up to 10'],
                  ['API Access', false, false, true],
                  ['Priority Support', false, true, true],
                ].map((row, i) => (
                  <tr key={i} className={isDark ? 'border-b border-white/5' : 'border-b border-black/5'}>
                    <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row[0]}
                    </td>
                    <td className={`text-center py-4 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {typeof row[1] === 'boolean' ? (
                        row[1] ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : <span className="text-gray-500">—</span>
                      ) : (
                        row[1]
                      )}
                    </td>
                    <td className={`text-center py-4 px-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    } font-medium`}>
                      {typeof row[2] === 'boolean' ? (
                        row[2] ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : <span className="text-gray-500">—</span>
                      ) : (
                        row[2]
                      )}
                    </td>
                    <td className={`text-center py-4 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {typeof row[3] === 'boolean' ? (
                        row[3] ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : <span className="text-gray-500">—</span>
                      ) : (
                        row[3]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
