export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Listing {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website: string;
  logo_url: string;
  image_urls: string[];
  category_id: string | null;
  tags: string[];
  facet: string | null;
  user_id: string | null;
  is_verified: boolean;
  is_boosted: boolean;
  is_featured: boolean;
  views_30d: number;
  clicks_30d: number;
  trending_score: number;
  delisted_at: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image_url: string;
  tags: string[];
  published_at: string;
}
