import { useEffect, useState } from 'react';
import { entity } from '../../site.config';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import ListingCard from '../components/ui/ListingCard';
import type { Listing } from '../types';

const PAGE = 24;

export default function IndexPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('listings')
      .select('*', { count: 'exact' })
      .order('is_boosted', { ascending: false })
      .order('trending_score', { ascending: false })
      .order('name')
      .range(page * PAGE, page * PAGE + PAGE - 1)
      .then(({ data, count }) => {
        setListings((prev) => (page === 0 ? (data ?? []) : [...prev, ...(data ?? [])]));
        setTotal(count ?? null);
        setLoading(false);
      });
  }, [page]);

  useSEO({ title: `All ${entity.plural}`, url: `/${entity.path}` });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2 capitalize">{entity.plural}</h1>
      {total !== null && <p className="text-surface-400 mb-8">{total.toLocaleString()} listed.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>

      {total !== null && listings.length < total && (
        <button onClick={() => setPage((p) => p + 1)} disabled={loading} className="btn-secondary text-sm mt-8 mx-auto block">
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
