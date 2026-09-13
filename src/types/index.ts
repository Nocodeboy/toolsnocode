export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website: string;
  logo_url: string;
  screenshot_urls: string[];
  category_id: string;
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  pricing_details: string;
  tags: string[];
  rating: number;
  review_count: number;
  upvotes: number;
  views_30d: number;
  clicks_30d: number;
  trending_score: number;
  is_featured: boolean;
  is_trending: boolean;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
  user_id?: string;
  category?: Category;
  verification_token?: string | null;
  is_verified?: boolean;
  verified_at?: string | null;
  is_boosted?: boolean;
  boost_expires_at?: string | null;
  video_url?: string;
  boost_plan?: string;
}

export interface Expert {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  country: string;
  languages: string[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  portfolio_url: string;
  is_featured: boolean;
  created_at: string;
  user_id?: string;
  tools?: Tool[];
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  tool_id: string;
  video_url: string;
  content_type: 'video' | 'guide' | 'course' | 'article';
  duration_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  author_name: string;
  thumbnail_url: string;
  created_at: string;
  user_id?: string;
  tool?: Tool;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  screenshot_url: string;
  live_url: string;
  author_name: string;
  upvotes: number;
  created_at: string;
  user_id?: string;
  tools?: Tool[];
}

export interface Favorite {
  id: string;
  user_id: string;
  item_type: 'tools' | 'experts' | 'tutorials' | 'projects';
  item_id: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string | null;
  url: string;
  source: string;
  image_url: string | null;
  category: string;
  tags: string[];
  published_at: string;
  is_featured: boolean;
  created_at: string;
}

export interface ClaimRequest {
  id: string;
  item_type: 'tools' | 'experts';
  item_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  justification: string;
  contact_proof: string;
  admin_note: string;
  reviewed_at: string | null;
  created_at: string;
}
