import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bookmark,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenSearch }) => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Business', slug: 'business' },
    { name: 'Science', slug: 'science' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Education', slug: 'education' },
    { name: 'Entertainment', slug: 'entertainment' },
  ];

  const handleNav = (view: string, param?: string) => {
    onNavigate(view, param);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                  News<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Hub</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 -mt-1">
                  AI-Powered
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1">
              <button
                onClick={() => handleNav('home')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentView === 'home'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                Home
              </button>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => handleNav('category', cat.slug)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    currentView === 'category' && (window as any)._activeCategorySlug === cat.slug
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Actions (Search, Theme, Auth, Admin) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer"
              title="Search news articles"
            >
              <Search className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-500">
                ⌘K
              </kbd>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Bookmarks (when logged in) */}
            {user && (
              <button
                onClick={() => handleNav('bookmarks')}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                  currentView === 'bookmarks'
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Saved Articles"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}

            {/* Admin Dashboard Quick Link (if Admin) */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                    : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </button>
            )}

            {/* User Dropdown / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-gray-900 transition-all cursor-pointer"
                >
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/30"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => handleNav('profile')}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      View Profile
                    </button>

                    <button
                      onClick={() => handleNav('bookmarks')}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-gray-400" />
                      Saved Articles
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        Admin Dashboard
                      </button>
                    )}

                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between ${
              currentView === 'home'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Home
          </button>

          <div className="pt-2 pb-1 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Categories
          </div>

          <div className="grid grid-cols-2 gap-1.5 px-2">
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => handleNav('category', cat.slug)}
                className="text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={toggleTheme}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>Theme</span>
              </span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => handleNav('admin')}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </button>
            </div>
          )}

          {!user && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNav('login')}
                className="w-full py-2.5 text-center text-xs font-bold rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-indigo-600 text-white"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
