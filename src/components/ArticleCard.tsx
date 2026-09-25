import React, { useState } from 'react';
import { Heart, Bookmark, Clock, ArrowRight, Eye, MessageSquare } from 'lucide-react';
import { Article } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface ArticleCardProps {
  article: Article;
  variant?: 'standard' | 'featured' | 'compact' | 'trending';
  onReadMore: (article: Article) => void;
  onCategoryClick?: (categorySlug: string) => void;
  trendingRank?: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'standard',
  onReadMore,
  onCategoryClick,
  trendingRank,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isLiked, setIsLiked] = useState<boolean>(article.is_liked || false);
  const [likeCount, setLikeCount] = useState<number>(article.like_count || 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(article.is_bookmarked || false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isBookmarking, setIsBookmarking] = useState<boolean>(false);

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to like articles', 'info');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const res = await api.toggleLike(article.id);
      setIsLiked(res.is_liked);
      setLikeCount(res.like_count);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update like', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to bookmark articles', 'info');
      return;
    }
    if (isBookmarking) return;

    setIsBookmarking(true);
    try {
      const res = await api.toggleBookmark(article.id);
      setIsBookmarked(res.is_bookmarked);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update bookmark', 'error');
    } finally {
      setIsBookmarking(false);
    }
  };

  // Trending Variant
  if (variant === 'trending') {
    return (
      <div
        onClick={() => onReadMore(article)}
        className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/60 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group"
      >
        {trendingRank !== undefined && (
          <span className="text-3xl font-extrabold text-gray-200 dark:text-gray-800 group-hover:text-indigo-500/40 transition-colors font-mono shrink-0 select-none">
            0{trendingRank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              onClick={e => {
                e.stopPropagation();
                onCategoryClick?.(article.category_slug);
              }}
              className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {article.category_name}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">• {formattedDate}</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
            {article.title}
          </h4>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-rose-500' : ''}`} />
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.read_time_minutes}m
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Featured Hero Variant
  if (variant === 'featured') {
    return (
      <div
        onClick={() => onReadMore(article)}
        className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12"
      >
        <div className="lg:col-span-7 relative h-72 lg:h-[420px] overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-md">
              Featured Story
            </span>
            <span
              onClick={e => {
                e.stopPropagation();
                onCategoryClick?.(article.category_slug);
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-md hover:bg-white transition-colors"
            >
              {article.category_name}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="hidden lg:flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Featured Cover
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {formattedDate}</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
              {article.title}
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-6">
              {article.summary}
            </p>
          </div>

          <div>
            {/* Author info & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={article.author_image}
                  alt={article.author_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{article.author_name}</p>
                  <p className="text-[11px] text-gray-400">{article.read_time_minutes} min read</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLikeToggle}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                  }`}
                  title="Like article"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>

                <button
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isBookmarked
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900 text-indigo-600'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                  }`}
                  title="Bookmark article"
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
                </button>

                <button
                  onClick={() => onReadMore(article)}
                  className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  Read
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Grid Card
  return (
    <div
      onClick={() => onReadMore(article)}
      className="group flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-16/10 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span
            onClick={e => {
              e.stopPropagation();
              onCategoryClick?.(article.category_slug);
            }}
            className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur-md shadow-xs hover:bg-white transition-colors"
          >
            {article.category_name}
          </span>
        </div>

        {article.status === 'draft' && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
              Draft
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.read_time_minutes} min read
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
            {article.title}
          </h3>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {article.summary}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={article.author_image}
              alt={article.author_name}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
              {article.author_name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLikeToggle}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                isLiked
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Like"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="text-[11px]">{likeCount}</span>
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isBookmarked
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
            </button>

            <button
              onClick={() => onReadMore(article)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 ml-1 cursor-pointer"
            >
              Read
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
