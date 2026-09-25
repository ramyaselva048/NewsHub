import React, { useState, useEffect } from 'react';
import { Compass, Mail, CheckCircle2, ArrowRight, Shield, Globe } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';

interface FooterProps {
  onCategoryClick: (slug: string) => void;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onCategoryClick, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([
    { name: 'Technology', slug: 'technology' },
    { name: 'Business', slug: 'business' },
    { name: 'Science', slug: 'science' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Education', slug: 'education' },
    { name: 'Entertainment', slug: 'entertainment' },
    { name: 'Environment', slug: 'environment' },
  ]);

  useEffect(() => {
    let isMounted = true;
    api.getCategories()
      .then(cats => {
        if (isMounted && cats && cats.length > 0) {
          setCategories(cats.map(c => ({ name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setSubscribed(true);
    showToast('Subscribed to NewsHub Daily Briefing!', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                News<span className="text-indigo-400">Hub</span>
              </span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Independent journalism powered by cutting-edge AI verification and analysis.
              Bringing real-time clarity to global breakthroughs in technology, science, economics, and culture.
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Editorial Integrity
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Global Bureau
              </span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map(cat => (
                <li key={cat.slug}>
                  <button
                    onClick={() => onCategoryClick(cat.slug)}
                    className="hover:text-indigo-400 transition-colors text-gray-400 hover:translate-x-1 transform inline-block cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-indigo-400 transition-colors text-gray-400 cursor-pointer"
                >
                  Latest Headlines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bookmarks')}
                  className="hover:text-indigo-400 transition-colors text-gray-400 cursor-pointer"
                >
                  Saved Articles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('profile')}
                  className="hover:text-indigo-400 transition-colors text-gray-400 cursor-pointer"
                >
                  Account Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-indigo-400 transition-colors text-indigo-400 cursor-pointer font-medium"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
              The Daily Intelligence
            </h4>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Curated breakthroughs and AI-summarized insights delivered directly to your inbox every morning.
            </p>

            {subscribed ? (
              <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs font-medium">You're subscribed! Check your inbox for the daily digest.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-24 py-2.5 text-xs bg-gray-800/90 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Join
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">Zero spam. Unsubscribe with one click anytime.</p>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} NewsHub Media Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Google Gemini 3.8</span>
            <span>PostgreSQL & Flask Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
