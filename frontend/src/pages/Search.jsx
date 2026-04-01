import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Briefcase, FileText, Sparkles, MapPin, Building2, Calendar, ArrowRight, Loader2, X } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [localQuery, setLocalQuery] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setSearched(true);

    try {
      const response = await apiService.search(q);
      if (response.success) {
        setResults(response.data);
      } else {
        setResults({ applications: [], jobs: [], total: 0 });
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults({ applications: [], jobs: [], total: 0 });
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!localQuery.trim()) return;
    setSearchParams({ q: localQuery.trim() });
  };

  const clearSearch = () => {
    setLocalQuery('');
    setSearchParams({});
    setResults(null);
    setSearched(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Search</h1>
          <p className="text-gray-400 text-sm">Find applications, jobs, and resources across your workspace</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search applications, jobs, skills..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-base placeholder-gray-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {localQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!localQuery.trim() || isSearching}
            className="mt-3 gradient-btn px-6 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        {/* Results */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Searching...</p>
          </div>
        )}

        {!isSearching && searched && results && (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">
                {results.total === 0
                  ? 'No results found'
                  : `${results.total} result${results.total === 1 ? '' : 's'} for "${query}"`}
              </p>
            </div>

            {/* No Results */}
            {results.total === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No results found</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Try different keywords or check your spelling
                </p>
                <button
                  onClick={clearSearch}
                  className="text-primary hover:underline text-sm"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Applications Results */}
            {results.applications.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Applications ({results.applications.length})</span>
                </h2>
                <div className="space-y-3">
                  {results.applications.map((app) => (
                    <Link
                      key={app._id}
                      to="/applications"
                      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium group-hover:text-primary transition-colors">{app.role}</h3>
                          <div className="flex items-center space-x-3 mt-1 text-gray-400 text-sm">
                            <span className="flex items-center space-x-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{app.company}</span>
                            </span>
                            {app.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{app.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          app.status === 'applied' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          app.status === 'interview' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs / Resources Results */}
            {results.jobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <span>Jobs & Resources ({results.jobs.length})</span>
                </h2>
                <div className="space-y-3">
                  {results.jobs.map((job) => (
                    <a
                      key={job._id}
                      href={job.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium group-hover:text-primary transition-colors">{job.title}</h3>
                          <div className="flex items-center space-x-3 mt-1 text-gray-400 text-sm">
                            <span className="flex items-center space-x-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{job.company}</span>
                            </span>
                            {job.postedDate && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tools Suggestions */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Try AI Tools</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Use our AI tools to enhance your search or prepare for applications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/ai-tools"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors"
                    >
                      Answer Generator
                    </Link>
                    <Link
                      to="/ai-tools"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors"
                    >
                      Cover Letter
                    </Link>
                    <Link
                      to="/ai-tools"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors"
                    >
                      Cold Outreach
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Initial State */}
        {!isSearching && !searched && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Start searching</h3>
            <p className="text-gray-400 text-sm">
              Enter keywords to search across your applications and resources
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
