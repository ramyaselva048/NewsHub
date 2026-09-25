/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { SavedArticlesPage } from './pages/SavedArticlesPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Article } from './types';

export function NewsHubApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<number | string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('technology');
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  // Keyboard shortcut Cmd+K / Ctrl+K for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'article' && param) {
      setSelectedArticleId(param);
      setCurrentView('article');
    } else if (view === 'category' && param) {
      setSelectedCategorySlug(param);
      (window as any)._activeCategorySlug = param;
      setCurrentView('category');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticleId(article.id);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    (window as any)._activeCategorySlug = slug;
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/40 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onSelectArticle={handleSelectArticle}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentView === 'article' && selectedArticleId && (
          <ArticleDetailPage
            articleId={selectedArticleId}
            onBack={() => handleNavigate('home')}
            onSelectArticle={handleSelectArticle}
            onCategoryClick={handleSelectCategory}
          />
        )}

        {currentView === 'category' && (
          <CategoryPage
            categorySlug={selectedCategorySlug}
            onBack={() => handleNavigate('home')}
            onSelectArticle={handleSelectArticle}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentView === 'bookmarks' && (
          <SavedArticlesPage
            onBack={() => handleNavigate('home')}
            onSelectArticle={handleSelectArticle}
            onCategoryClick={handleSelectCategory}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            onNavigateToBookmarks={() => handleNavigate('bookmarks')}
            onNavigateToAdmin={() => handleNavigate('admin')}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onNavigateToRegister={() => handleNavigate('register')}
            onSuccess={() => handleNavigate('home')}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onNavigateToLogin={() => handleNavigate('login')}
            onSuccess={() => handleNavigate('home')}
          />
        )}

        {currentView === 'admin' && <AdminDashboardPage />}
      </div>

      <Footer
        onCategoryClick={handleSelectCategory}
        onNavigate={handleNavigate}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectArticle={handleSelectArticle}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NewsHubApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
