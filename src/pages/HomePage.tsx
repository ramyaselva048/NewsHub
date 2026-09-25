import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Filter, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { Article, Category } from '../types';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { useToast } from '../components/Toast';

interface HomePageProps {
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectArticle, onSelectCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, trending] = await Promise.all([
          api.getCategories(),
          api.getTrendingArticles(),
        ]);
        setCategories(cats);
        setTrendingArticles(trending);
      } catch (err: any) {
        showToast(err.message || 'Failed loading homepage data', 'error');
      }
    }
    loadInitial();
  }, []);

  // Load articles on filter/page change
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const res = await api.getArticles({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          page,
          limit: 9,
        });
        setArticles(res.articles);
        setTotalPages(res.pagination.totalPages);
      } catch (err: any) {
        showToast(err.message || 'Failed loading articles', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [selectedCategory, page]);

  const isAllCategory = selectedCategory === 'all' && page === 1;
  const featuredArticle = isAllCategory ? (articles.find(a => a.is_featured) || articles[0]) : null;
  const gridArticles = isAllCategory && featuredArticle
    ? articles.filter(a => a.id !== featuredArticle.id)
    : articles;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 transition-colors">
      {/* Hero Breaking Ticker */}
      <div className="bg-indigo-900 text-indigo-100 text-xs py-2 px-4 border-b border-indigo-800">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-hidden">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-sm shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Breaking Dispatch
          </span>
          <p className="truncate text-indigo-200">
            Helios-IV commercial quantum processor demonstrates ambient room-temperature topological coherence, accelerating energy storage chemistry.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Featured Story Header */}
        {featuredArticle && page === 1 && selectedCategory === 'all' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Featured Editorial
              </h2>
            </div>
            <ArticleCard
              article={featuredArticle}
              variant="featured"
              onReadMore={onSelectArticle}
              onCategoryClick={onSelectCategory}
            />
          </section>
        )}

        {/* Trending Section */}
        {trendingArticles.length > 0 && page === 1 && selectedCategory === 'all' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Trending Intelligence
              </h2>
              <span className="text-xs text-gray-500">Most engaged by reader network</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingArticles.slice(0, 3).map((art, idx) => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  variant="trending"
                  trendingRank={idx + 1}
                  onReadMore={onSelectArticle}
                  onCategoryClick={onSelectCategory}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Article Feed & Category Filter */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {selectedCategory === 'all'
                  ? 'Latest Articles'
                  : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Dispatches`}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verified reporting, analysis, and research findings
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                }`}
              >
                All Stories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800/60 rounded-2xl" />
              ))}
            </div>
          ) : gridArticles.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
              <Compass className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No articles found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No articles are available in this category yet. Check back soon or browse another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="standard"
                  onReadMore={onSelectArticle}
                  onCategoryClick={onSelectCategory}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                        page === pNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
