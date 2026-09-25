import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  Layers,
  Eye,
  Heart,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  Sparkles,
  BarChart3,
  Shield,
  ShieldAlert,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { AdminStats, Article, Category, Comment, UserWithStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

type AdminTab = 'overview' | 'articles' | 'categories' | 'users' | 'comments';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [articleSearch, setArticleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modals state
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Article Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [submittingArticle, setSubmittingArticle] = useState(false);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // User Email Edit Modal State
  const [editingUserEmailModal, setEditingUserEmailModal] = useState<{ id: number; name: string; email: string } | null>(null);
  const [newUserEmailInput, setNewUserEmailInput] = useState('');
  const [savingUserEmail, setSavingUserEmail] = useState(false);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'article' | 'category' | 'user' | 'comment';
    id: number;
    title: string;
  } | null>(null);

  // Curated Unsplash images for quick picker in article modal
  const imagePresets = [
    { label: 'Quantum Tech', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Clean Energy', url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Sports Science', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80' },
    { label: 'STEM Education', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Digital Cinema', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, articlesRes, categoriesData, usersData, commentsData] = await Promise.all([
        api.getAdminStats(),
        api.getArticles({ limit: 100 }),
        api.getCategories(),
        api.getAdminUsers(),
        api.getAdminComments(),
      ]);

      setStats(statsData);
      setArticles(articlesRes.articles);
      setCategories(categoriesData);
      setUsers(usersData);
      setComments(commentsData);
      if (categoriesData.length > 0) {
        setFormCategoryId(categoriesData[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed loading admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateArticle = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormContent('');
    setFormSummary('');
    setFormImageUrl(imagePresets[0].url);
    setFormCategoryId(categories[0]?.id || 1);
    setFormStatus('published');
    setFormIsFeatured(false);
    setArticleModalOpen(true);
  };

  const openEditArticle = (art: Article) => {
    setEditingArticle(art);
    setFormTitle(art.title);
    setFormContent(art.content);
    setFormSummary(art.summary);
    setFormImageUrl(art.image_url);
    setFormCategoryId(art.category_id);
    setFormStatus(art.status);
    setFormIsFeatured(!!art.is_featured);
    setArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) {
      showToast('Title and content are required', 'error');
      return;
    }

    setSubmittingArticle(true);
    try {
      if (editingArticle) {
        await api.updateArticle(editingArticle.id, {
          title: formTitle,
          content: formContent,
          summary: formSummary,
          image_url: formImageUrl,
          category_id: formCategoryId,
          status: formStatus,
          is_featured: formIsFeatured,
        });
        showToast('Article updated successfully', 'success');
      } else {
        await api.createArticle({
          title: formTitle,
          content: formContent,
          summary: formSummary,
          image_url: formImageUrl,
          category_id: formCategoryId,
          status: formStatus,
          is_featured: formIsFeatured,
        });
        showToast('Article created and published', 'success');
      }
      setArticleModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed saving article', 'error');
    } finally {
      setSubmittingArticle(false);
    }
  };

  const handleToggleArticleStatus = async (id: number) => {
    try {
      const res = await api.toggleArticleStatus(id);
      setArticles(articles.map(a => (a.id === id ? res.article : a)));
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed changing status', 'error');
    }
  };

  const [resettingDB, setResettingDB] = useState(false);

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset all database records (articles, users, comments, bookmarks) back to defaults?')) {
      return;
    }
    setResettingDB(true);
    try {
      await api.resetDatabase();
      showToast('Database reset successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed resetting database', 'error');
    } finally {
      setResettingDB(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryName.trim(), categoryDesc.trim());
        showToast('Category updated', 'success');
      } else {
        await api.createCategory(categoryName.trim(), categoryDesc.trim());
        showToast('Category added', 'success');
      }
      setCategoryModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed saving category', 'error');
    }
  };

  const handleToggleUserRole = async (u: UserWithStats) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(u.id, nextRole);
      setUsers(users.map(item => (item.id === u.id ? { ...item, role: nextRole } : item)));
      showToast(`User ${u.name} role changed to ${nextRole}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed changing user role', 'error');
    }
  };

  const handleSaveUserEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserEmailModal || !newUserEmailInput.trim()) return;

    setSavingUserEmail(true);
    try {
      await api.updateUserEmail(editingUserEmailModal.id, newUserEmailInput.trim());
      showToast(`Email for ${editingUserEmailModal.name} updated to ${newUserEmailInput.trim()}!`, 'success');
      setEditingUserEmailModal(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed updating user email', 'error');
    } finally {
      setSavingUserEmail(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'article') {
        await api.deleteArticle(deleteConfirm.id);
        showToast('Article deleted successfully', 'success');
      } else if (deleteConfirm.type === 'category') {
        await api.deleteCategory(deleteConfirm.id);
        showToast('Category deleted successfully', 'success');
      } else if (deleteConfirm.type === 'user') {
        await api.deleteUser(deleteConfirm.id);
        showToast('User account deleted', 'success');
      } else if (deleteConfirm.type === 'comment') {
        await api.deleteComment(deleteConfirm.id);
        showToast('Comment deleted', 'success');
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Article filtering
  const filteredArticles = articles.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      a.category_name.toLowerCase().includes(articleSearch.toLowerCase()) ||
      a.author_name.toLowerCase().includes(articleSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-gray-500 mt-2">
          Administrator credentials are required to view the editorial management panel.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Shield className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Editorial Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Manage articles, verify user comments, track analytics, and configure publishing desks
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={resettingDB}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Reset sample articles, users, comments and stats back to default"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resettingDB ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
                {resettingDB ? 'Resetting...' : 'Reset Database'}
              </button>
              <button
                onClick={openCreateArticle}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Article
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto border-t border-gray-100 dark:border-gray-800 pt-4 scrollbar-none">
            {[
              { id: 'overview', label: 'Overview & Stats', icon: BarChart3 },
              { id: 'articles', label: `Articles (${articles.length})`, icon: FileText },
              { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
              { id: 'users', label: `Users (${users.length})`, icon: Users },
              { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Readers</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <p className="text-[11px] text-gray-400 mt-1">Registered members</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Dispatches</span>
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalArticles}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.publishedArticles} published / {stats.draftArticles} drafts
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
                  <Eye className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400 mt-1">All-time impressions</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Comments</span>
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalComments}</p>
                <p className="text-[11px] text-gray-400 mt-1">Reader responses</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Desks</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalCategories}</p>
                <p className="text-[11px] text-gray-400 mt-1">Covering global sectors</p>
              </div>
            </div>

            {/* Visual Distribution & Top Viewed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Category Breakdown */}
              <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Category Distribution
                </h3>
                <div className="space-y-4">
                  {stats.categoryDistribution.map(cat => {
                    const pct = stats.totalArticles > 0 ? Math.round((cat.count / stats.totalArticles) * 100) : 0;
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.name}</span>
                          <span className="text-gray-400">
                            {cat.count} articles ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Read Articles */}
              <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Highest Traffic Dispatches
                </h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.topArticles.map((top, index) => (
                    <div key={top.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-xs font-mono font-bold text-gray-400">0{index + 1}</span>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {top.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          {top.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          {top.likes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ARTICLES MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'articles' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Status Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  placeholder="Filter articles..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(['all', 'published', 'draft'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Article</th>
                      <th className="py-3.5 px-4">Desk</th>
                      <th className="py-3.5 px-4">Author</th>
                      <th className="py-3.5 px-4">Traffic</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {filteredArticles.map(art => (
                      <tr key={art.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 sm:px-6 max-w-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={art.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate">
                                {art.title}
                              </p>
                              <span className="text-[11px] text-gray-400 font-mono">
                                ID: #{art.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {art.category_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                          {art.author_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-blue-500" />
                              {art.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-500" />
                              {art.like_count}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleArticleStatus(art.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                              art.status === 'published'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                            title="Click to toggle publish status"
                          >
                            {art.status === 'published' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {art.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditArticle(art)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                              title="Edit article"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'article',
                                  id: art.id,
                                  title: `Article "${art.title}"`,
                                })
                              }
                              className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                              title="Delete article"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Editorial Desks</h3>
                <p className="text-xs text-gray-500">Add, edit, or configure article taxonomy</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                  setCategoryDesc('');
                  setCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Desk #{cat.id}
                      </span>
                      <span className="text-xs text-gray-400">
                        {cat.article_count || 0} stories
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {cat.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryName(cat.name);
                        setCategoryDesc(cat.description);
                        setCategoryModalOpen(true);
                      }}
                      className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'category',
                          id: cat.id,
                          title: `Category "${cat.name}"`,
                        })
                      }
                      className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: USERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Contributions</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {users.map(u => {
                      const joinDate = new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const isSelf = user?.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.profile_image}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0"
                              />
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {u.comments_count} comments • {u.bookmarks_count} saved
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">{joinDate}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingUserEmailModal({ id: u.id, name: u.name, email: u.email });
                                  setNewUserEmailInput(u.email);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                title="Change email address"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserRole(u)}
                                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: 'user',
                                        id: u.id,
                                        title: `User "${u.name}"`,
                                      })
                                    }
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: COMMENTS MODERATION */}
        {/* ======================================================== */}
        {activeTab === 'comments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Comment</th>
                      <th className="py-3.5 px-4">Author</th>
                      <th className="py-3.5 px-4">Article</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {comments.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 sm:px-6 max-w-sm">
                          <p className="line-clamp-2 leading-relaxed font-normal">{c.comment}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {c.user_name}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-indigo-600 dark:text-indigo-400">
                          {c.article_title}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'comment',
                                id: c.id,
                                title: `Comment by "${c.user_name}"`,
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Delete offensive comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ARTICLE CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingArticle ? 'Edit Article' : 'Draft New Dispatch'}
            </h3>

            <form onSubmit={handleSaveArticle} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Article Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  placeholder="e.g. Next-Generation Solid State Electrolytes..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Category Desk
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={e => setFormCategoryId(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'published' | 'draft')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Saved only)</option>
                  </select>
                </div>
              </div>

              {/* Cover Image Input & Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  required
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-gray-400 mr-1 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Quick Presets:
                  </span>
                  {imagePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormImageUrl(preset.url)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Executive Brief / Summary
                </label>
                <textarea
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  rows={2}
                  placeholder="Brief 1-2 sentence lead abstract..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Article Content
                </label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  required
                  rows={8}
                  placeholder="Write complete article. Markdown headers (### Subheading) and pullquotes (> Quote) are supported."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formIsFeatured}
                  onChange={e => setFormIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm border-gray-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor="featuredCheck"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Feature this article prominently on homepage hero showcase
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingArticle}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  {submittingArticle ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY ADD / EDIT MODAL */}
      {/* ======================================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  required
                  placeholder="e.g. Climate & Environment"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={categoryDesc}
                  onChange={e => setCategoryDesc(e.target.value)}
                  rows={3}
                  placeholder="Focus of this editorial desk..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Email Modal */}
      {editingUserEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    Change Account Email
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    User: {editingUserEmailModal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUserEmailModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Email
                </label>
                <input
                  type="email"
                  value={editingUserEmailModal.email}
                  disabled
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmailInput}
                  onChange={e => setNewUserEmailInput(e.target.value)}
                  required
                  placeholder="new.email@example.com"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingUserEmailModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUserEmail}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {savingUserEmail ? 'Saving...' : 'Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete this ${deleteConfirm?.type || 'item'} (${deleteConfirm?.title})? This action cannot be undone.`}
        confirmLabel="Permanently Delete"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
