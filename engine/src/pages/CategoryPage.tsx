import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { facets } from '../../site.config';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import ListingCard from '../components/ui/ListingCard';
import type { Category, Listing } from '../types';

export default function CategoryPage() {
  const { slug, facet } = useParams<{ slug: string; facet?: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [variants, setVariants] = useState<{ facet: string; listing_count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from('categories').select('*').eq('slug', slug).maybeSingle().then(({ data, error }) => {
      if (!data && !error) setNotFound(true);
      setCategory(data as Category | null);
      if (!data) return;
      let q = supabase.from('listings').select('*', { count: 'exact' }).eq('category_id', data.id);
      if (facet) q = q.eq('facet', facet);
      q.order('is_boosted', { ascending: false }).order('trending_score', { ascending: false }).limit(48)
        .then(({ data: rows, count }) => {
          setListings((rows ?? []) as Listing[]);
          setTotal(count ?? 0);
          if (facet && (count ?? 0) === 0) setNotFound(true);
        });
      supabase.from('category_facet_counts').select('facet,listing_count').eq('category_id', data.id)
        .then(({ data: v }) => setVariants((v ?? []) as { facet: string; listing_count: number }[]));
    });
  }, [slug, facet]);

  const label = facet ? facets.labels[facet] ?? facet : null;
  const title = category ? (facet ? `${label} ${category.name}` : category.name) : undefined;

  useSEO({
    title: title ? `${title} — ${total} listed` : undefined,
    description: category?.description || undefined,
    url: category ? (facet ? `/categories/${category.slug}/${facet}` : `/categories/${category.slug}`) : undefined,
    // Una faceta con cuatro fichas es contenido pobre: funciona, pero no se
    // anuncia. Y una que no existe contesta como lo que es.
    noindex: notFound || (Boolean(facet) && total < facets.indexMin),
  });

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Not found</h1>
        <Link to="/categories" className="btn-primary">All categories</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">{title ?? '…'}</h1>
      <p className="text-surface-400 mb-6">{total} listed.</p>
      {category?.description && <p className="text-surface-300 max-w-3xl mb-8">{category.description}</p>}

      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {variants.map((v) => (
            <Link key={v.facet} to={`/categories/${slug}/${v.facet}`}
              className={`px-3 py-1.5 rounded-lg border text-sm ${v.facet === facet ? 'border-brand-500/40 text-brand-400 bg-brand-500/10' : 'border-surface-700 text-surface-300 hover:border-surface-600'}`}>
              {facets.labels[v.facet] ?? v.facet} <span className="text-surface-500">{v.listing_count}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </div>
  );
}
