import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, BookOpen, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { useToast } from '../components/Toast';

interface SavedArticlesPageProps {
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onCategoryClick: (slug: string) => void;
}

export const SavedArticlesPage: React.FC<SavedArticlesPageProps> = ({
  onBack,
  onSelectArticle,
  onCategoryClick,
}) => {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await api.getBookmarks();
      setBookmarks(data);
    } catch (err: any) {
      showToast(err.message || 'Failed loading saved articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleRemoveBookmark = async (articleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleBookmark(articleId);
      setBookmarks(prev => prev.filter(a => a.id !== articleId));
      showToast('Article removed from saved reading list', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed removing bookmark', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </button>

          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Bookmark className="w-6 h-6 fill-indigo-600/20" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Reading Library
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {bookmarks.length} bookmarked {bookmarks.length === 1 ? 'article' : 'articles'} saved for later reading
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarks Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800/60 rounded-2xl" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 max-w-md mx-auto shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Reading List is Empty</h3>
            <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
              When browsing NewsHub, click the bookmark icon on any article card or reading view to save it here for offline or later reading.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Explore Today's Headlines
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(article => (
              <div key={article.id} className="relative group">
                <ArticleCard
                  article={article}
                  variant="standard"
                  onReadMore={onSelectArticle}
                  onCategoryClick={onCategoryClick}
                />
                <button
                  onClick={e => handleRemoveBookmark(article.id, e)}
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 text-rose-500 hover:text-rose-600 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove from bookmarks"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
