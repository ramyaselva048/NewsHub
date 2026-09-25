import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';
import { Article, Category } from '../types';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { useToast } from '../components/Toast';

interface CategoryPageProps {
  categorySlug: string;
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (slug: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  onBack,
  onSelectArticle,
  onSelectCategory,
}) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadCategoryArticles() {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const [cats, res] = await Promise.all([
          api.getCategories(),
          api.getArticles({ category: categorySlug, limit: 12 }),
        ]);

        const currentCat = cats.find(c => c.slug.toLowerCase() === categorySlug.toLowerCase());
        setCategory(currentCat || {
          id: 0,
          name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
          slug: categorySlug,
          description: `All reports and analyses filed under ${categorySlug}.`,
        });
        setArticles(res.articles);
      } catch (err: any) {
        showToast(err.message || 'Failed loading category articles', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadCategoryArticles();
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 pb-20">
      {/* Category Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All News
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Category Desk
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {category?.name}
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            {category?.description}
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800/60 rounded-2xl" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No articles in this desk</h3>
            <p className="text-xs text-gray-500 mt-1">
              Check back soon as our journalists file new dispatches in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
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
      </main>
    </div>
  );
};
