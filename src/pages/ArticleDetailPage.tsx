import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bookmark,
  Share2,
  Clock,
  Calendar,
  Sparkles,
  MessageSquare,
  Trash2,
  ArrowLeft,
  Check,
  Send,
  Eye,
  CornerDownRight,
} from 'lucide-react';
import { Article, Comment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { AISummaryCard } from '../components/AISummaryCard';
import { ArticleCard } from '../components/ArticleCard';
import { ConfirmModal } from '../components/ConfirmModal';

interface ArticleDetailPageProps {
  articleId: number | string;
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onCategoryClick: (slug: string) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  articleId,
  onBack,
  onSelectArticle,
  onCategoryClick,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Likes & Bookmarks State
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Modals & Popovers
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const [articleData, commentsData] = await Promise.all([
          api.getArticle(articleId),
          api.getComments(Number(articleId)),
        ]);
        setArticle(articleData.article);
        setRelatedArticles(articleData.related as any);
        setComments(commentsData);
        setIsLiked(articleData.article.is_liked || false);
        setLikeCount(articleData.article.like_count || 0);
        setIsBookmarked(articleData.article.is_bookmarked || false);
      } catch (err: any) {
        showToast(err.message || 'Failed to load article', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId]);

  const handleLike = async () => {
    if (!user) {
      showToast('Please sign in to like this story', 'info');
      return;
    }
    if (!article) return;
    try {
      const res = await api.toggleLike(article.id);
      setIsLiked(res.is_liked);
      setLikeCount(res.like_count);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating like', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      showToast('Please sign in to save articles', 'info');
      return;
    }
    if (!article) return;
    try {
      const res = await api.toggleBookmark(article.id);
      setIsBookmarked(res.is_bookmarked);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating bookmark', 'error');
    }
  };

  const handleShare = (channel: 'copy' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    const title = article ? article.title : 'NewsHub Story';

    if (channel === 'copy') {
      navigator.clipboard.writeText(url);
      showToast('Article link copied to clipboard!', 'success');
    } else if (channel === 'twitter') {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    } else if (channel === 'linkedin') {
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    }
    setShareOpen(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to comment', 'info');
      return;
    }
    if (!newComment.trim() || !article) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(article.id, newComment.trim());
      setComments([res.comment, ...comments]);
      setNewComment('');
      showToast('Comment posted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await api.deleteComment(commentToDelete);
      setComments(comments.filter(c => c.id !== commentToDelete));
      showToast('Comment removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    } finally {
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24" />
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Article not found</h2>
        <p className="text-sm text-gray-500 mt-2">The requested story could not be retrieved.</p>
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Return to Headlines
        </button>
      </div>
    );
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="min-h-screen bg-gray-50/40 dark:bg-gray-950/40 transition-colors pb-24">
      {/* Top back navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md sticky top-16 sm:top-20 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views} views
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => onCategoryClick(article.category_slug)}
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition cursor-pointer"
          >
            {article.category_name}
          </button>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.read_time_minutes} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        {/* Author Bio Banner & Social Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex items-center gap-3">
            <img
              src={article.author_image}
              alt={article.author_name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{article.author_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Editorial Staff & Contributing Researcher</p>
            </div>
          </div>

          {/* Action Buttons: Like, Bookmark, Share */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Menu */}
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              {shareOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in duration-150">
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    Copy Article Link
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    Share on X / Twitter
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    Share on LinkedIn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Cover Image */}
        <div className="rounded-3xl overflow-hidden mb-8 shadow-xl border border-gray-200 dark:border-gray-800">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-[320px] sm:h-[480px] object-cover"
          />
        </div>

        {/* AI SUMMARY COMPONENT (Gemini-Powered) */}
        <AISummaryCard
          articleId={article.id}
          initialSummary={article.summary}
          articleTitle={article.title}
        />

        {/* Formatted Article Body */}
        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 text-base sm:text-lg leading-relaxed font-normal space-y-6">
          {article.content.split('\n\n').map((block, idx) => {
            if (block.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white pt-4">
                  {block.replace('### ', '')}
                </h3>
              );
            }
            if (block.startsWith('> ')) {
              return (
                <blockquote
                  key={idx}
                  className="pl-5 border-l-4 border-indigo-600 dark:border-indigo-400 italic text-gray-700 dark:text-gray-300 my-6 text-lg sm:text-xl font-serif bg-indigo-50/50 dark:bg-indigo-950/20 py-3 rounded-r-xl"
                >
                  {block.replace('> ', '')}
                </blockquote>
              );
            }
            return (
              <p key={idx} className="leading-relaxed">
                {block}
              </p>
            );
          })}
        </div>

        {/* Bottom tags & reactions */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Filed under:</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
              #{article.category_slug}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-900 text-rose-600'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={handleBookmark}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-900 text-indigo-600'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <section className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Community Discussion ({comments.length})
            </h3>
          </div>

          {/* New Comment Input */}
          <div className="mb-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            {user ? (
              <form onSubmit={handleAddComment}>
                <div className="flex items-start gap-3">
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your perspective, research insights, or analysis..."
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-gray-400">
                        Posting as <span className="font-semibold text-gray-700 dark:text-gray-300">{user.name}</span>
                      </p>
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Sign in to join the verified discussion on this dispatch.
                </p>
                <button
                  onClick={() => showToast('Please sign in from the navbar to post comments', 'info')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Sign In to Comment
                </button>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No comments yet. Be the first to start the discussion!
              </p>
            ) : (
              comments.map(c => {
                const isOwner = user && (user.id === c.user_id || isAdmin);
                const commentDate = new Date(c.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={c.user_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                        alt={c.user_name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {c.user_name}
                          </span>
                          <span className="text-[11px] text-gray-400">• {commentDate}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                          {c.comment}
                        </p>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => setCommentToDelete(c.id)}
                        className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RELATED ARTICLES SECTION */}
        {relatedArticles.length > 0 && (
          <section className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">
              Related Dispatches in {article.category_name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((rel: any) => (
                <ArticleCard
                  key={rel.id}
                  article={rel}
                  variant="standard"
                  onReadMore={onSelectArticle}
                  onCategoryClick={onCategoryClick}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Delete Comment Confirmation Modal */}
      <ConfirmModal
        isOpen={commentToDelete !== null}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment? This action cannot be reversed."
        confirmLabel="Delete Comment"
        onConfirm={confirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </article>
  );
};
