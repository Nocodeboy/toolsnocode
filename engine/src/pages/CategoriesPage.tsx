import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

interface Row { name: string; slug: string; listing_count: number }

export default function CategoriesPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from('category_listing_counts').select('name,slug,listing_count')
      .order('listing_count', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  useSEO({ title: 'All categories', url: '/categories' });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Categories</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => (
          <Link key={c.slug} to={`/categories/${c.slug}`} className="glass-card p-4 hover:border-surface-600/80 transition-colors">
            <span className="text-surface-100 font-medium">{c.name}</span>
            <span className="text-surface-500 text-sm ml-2">{c.listing_count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
