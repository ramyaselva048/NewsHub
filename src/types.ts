export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profile_image: string;
  bio?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  article_count?: number;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  image_url: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  author_id: number;
  author_name: string;
  author_image: string;
  status: 'published' | 'draft';
  views: number;
  is_featured?: boolean;
  is_trending?: boolean;
  read_time_minutes: number;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  user_name: string;
  user_image: string;
  comment: string;
  created_at: string;
  article_title?: string;
  article_slug?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalComments: number;
  totalCategories: number;
  totalLikes: number;
  totalViews: number;
  categoryDistribution: { name: string; count: number }[];
  topArticles: {
    id: number;
    title: string;
    views: number;
    status: string;
    likes: number;
  }[];
}

export interface UserWithStats extends User {
  comments_count: number;
  bookmarks_count: number;
  articles_count: number;
}
