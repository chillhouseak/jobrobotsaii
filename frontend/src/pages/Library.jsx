import { useState } from 'react';
import { Bookmark, Search, FileText, MessageSquare, Mail, Copy, Trash2, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';

const Library = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const savedItems = [];

  const filteredItems = savedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cover': return FileText;
      case 'answer': return MessageSquare;
      case 'outreach': return Mail;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cover': return 'bg-violet-500/20 text-violet-400';
      case 'answer': return 'bg-amber-500/20 text-amber-400';
      case 'outreach': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const types = [
    { key: 'all', label: 'All' },
    { key: 'cover', label: 'Cover Letters' },
    { key: 'answer', label: 'Answers' },
    { key: 'outreach', label: 'Outreach' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <Bookmark className="w-6 h-6 text-primary-light" />
            <span>Library</span>
          </h1>
          <p className="text-gray-400">All your saved AI-generated content</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>
          <div className="flex space-x-2">
            {types.map((type) => (
              <button
                key={type.key}
                onClick={() => setFilterType(type.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterType === type.key
                    ? 'bg-primary/20 text-white border border-primary/50'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div key={item.id} className="glass-card p-4 hover:border-white/20 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(item.type)}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-2">{item.content}</p>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No saved items yet</h3>
            <p className="text-gray-400 mb-6">Your AI-generated content will appear here</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Library;
