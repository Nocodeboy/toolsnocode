import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entity, site } from '../../site.config';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import ListingCard from '../components/ui/ListingCard';
import type { Listing } from '../types';

interface CategoryCount { name: string; slug: string; listing_count: number }

export default function HomePage() {
  const [recent, setRecent] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('listings').select('*', { count: 'exact', head: true })
      .then(({ count }) => setTotal(count ?? null));
    supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setRecent(data ?? []));
    supabase.from('listings').select('*').eq('is_boosted', true).limit(4)
      .then(({ data }) => setFeatured(data ?? []));
    supabase.from('category_listing_counts').select('name,slug,listing_count').order('listing_count', { ascending: false })
      .then(({ data }) => setCategories((data ?? []) as CategoryCount[]));
  }, []);

  useSEO({ url: '/' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{site.tagline}</h1>
      <p className="text-surface-400 max-w-2xl mb-10">
        {site.description}{total !== null && ` ${total.toLocaleString(site.lang)} listed.`}
      </p>

      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Recently added</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} to={`/categories/${c.slug}`}
              className="px-3 py-1.5 rounded-lg border border-surface-700 text-sm text-surface-300 hover:text-white hover:border-surface-600">
              {c.name} <span className="text-surface-500">{c.listing_count}</span>
            </Link>
          ))}
        </div>
        <Link to={`/${entity.path}`} className="btn-primary text-sm mt-8">See everything</Link>
      </section>
    </div>
  );
}
