import { Article, Category, Comment, User, AdminStats, UserWithStats } from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('newshub_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    request<{
      user: User;
      stats: { bookmarksCount: number; likesCount: number; commentsCount: number };
    }>('/auth/me'),

  updateProfile: (profileData: { name?: string; email?: string; bio?: string; profile_image?: string }) =>
    request<{ message: string; user: User; token?: string; email_changed?: boolean }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; email: string; code: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    }),

  resetDatabase: () =>
    request<{ message: string; articles_count: number; users_count: number; categories_count: number }>('/reset-data', {
      method: 'POST',
    }),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (name: string, description: string) =>
    request<{ message: string; category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  updateCategory: (id: number, name: string, description: string) =>
    request<{ message: string; category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    }),
  deleteCategory: (id: number) =>
    request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),

  // Articles
  getArticles: (params?: { category?: string; status?: string; featured?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.featured) query.append('featured', 'true');
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{ articles: Article[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/articles?${query.toString()}`
    );
  },

  getArticle: (idOrSlug: string | number) =>
    request<{ article: Article; related: Article[] }>(`/articles/${idOrSlug}`),

  getTrendingArticles: () => request<Article[]>('/articles/trending'),

  searchArticles: (q: string) =>
    request<Article[]>(`/articles/search?q=${encodeURIComponent(q)}`),

  createArticle: (articleData: {
    title: string;
    content: string;
    summary?: string;
    image_url?: string;
    category_id: number;
    status: 'published' | 'draft';
    is_featured?: boolean;
  }) =>
    request<{ message: string; article: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    }),

  updateArticle: (id: number, articleData: Partial<Article>) =>
    request<{ message: string; article: Article }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    }),

  toggleArticleStatus: (id: number) =>
    request<{ message: string; article: Article }>(`/articles/${id}/status`, {
      method: 'PUT',
    }),

  deleteArticle: (id: number) =>
    request<{ message: string }>(`/articles/${id}`, { method: 'DELETE' }),

  // AI Summary
  generateSummary: (articleId: number) =>
    request<{ summary: string; source: string; note?: string; article_id: number }>(
      `/articles/${articleId}/summary`,
      { method: 'POST' }
    ),

  // Comments
  getComments: (articleId: number) => request<Comment[]>(`/articles/${articleId}/comments`),
  addComment: (articleId: number, comment: string) =>
    request<{ message: string; comment: Comment }>(`/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  deleteComment: (commentId: number) =>
    request<{ message: string }>(`/comments/${commentId}`, { method: 'DELETE' }),

  // Likes
  toggleLike: (articleId: number) =>
    request<{ is_liked: boolean; like_count: number; message: string }>(`/articles/${articleId}/like`, {
      method: 'POST',
    }),

  // Bookmarks
  getBookmarks: () => request<Article[]>('/bookmarks'),
  toggleBookmark: (articleId: number) =>
    request<{ is_bookmarked: boolean; message: string }>(`/articles/${articleId}/bookmark`, {
      method: 'POST',
    }),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  getAdminUsers: () => request<UserWithStats[]>('/admin/users'),
  updateUserRole: (userId: number, role: 'user' | 'admin') =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  updateUserEmail: (userId: number, email: string) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/email`, {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),
  deleteUser: (userId: number) =>
    request<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' }),
  getAdminComments: () => request<Comment[]>('/admin/comments'),
};
