import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import type { Post } from '../types';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    supabase.from('posts').select('*').order('published_at', { ascending: false }).limit(50)
      .then(({ data }) => setPosts((data ?? []) as Post[]));
  }, []);

  useSEO({ title: 'Blog', url: '/blog' });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Blog</h1>
      <div className="space-y-6">
        {posts.map((p) => (
          <article key={p.id}>
            <Link to={`/blog/${p.slug}`} className="text-lg font-semibold text-surface-100 hover:text-brand-400 transition-colors">
              {p.title}
            </Link>
            <p className="text-sm text-surface-500 mt-1">
              {new Date(p.published_at).toLocaleDateString()}
            </p>
            {p.summary && <p className="text-surface-400 mt-2">{p.summary}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
