import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Expert } from '../types';
import ExpertCard from '../components/ui/ExpertCard';
import SearchBar from '../components/ui/SearchBar';
import { useSEO } from '../hooks/useSEO';
import { ilikeAny } from '../lib/search';

const PAGE_SIZE = 24;

export default function ExpertsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const pageRef = useRef(0);
  const { user } = useAuth();

  useSEO({
    title: 'No-Code & AI Experts',
    description: 'Find and connect with top no-code and AI experts. Browse expert profiles, tools they use, and hire them for your next project.',
    url: '/experts',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'No-Code & AI Experts',
      url: 'https://toolsnocode.com/experts',
      description: 'Find and connect with top no-code and AI experts. Browse expert profiles, tools they use, and hire them for your next project.',
    },
  });

  const search = searchParams.get('q') || '';

  const buildQuery = useCallback((from: number, to: number) => {
    let query = supabase
      .from('experts')
      .select('*', { count: 'exact' })
      // Todos los expertos tienen rating 5.0 (viene del scraper), así que este
      // orden era arbitrario disfrazado de mérito.
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(ilikeAny(['name', 'bio', 'country'], search));
    }

    return query.range(from, to);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      pageRef.current = 0;
      const { data, count } = await buildQuery(0, PAGE_SIZE - 1);
      setExperts(data || []);
      setTotal(count ?? null);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setLoading(false);
    }
    load();
  }, [buildQuery]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await buildQuery(from, to);
    if (data && data.length > 0) {
      setExperts((prev) => [...prev, ...data]);
      pageRef.current = nextPage;
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    setSearchParams(params);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Find Experts</h1>
          <p className="text-surface-400">
            Connect with top AI and no-code professionals for your projects.
          </p>
        </div>
        {user && (
          <Link to="/experts/new" className="btn-primary text-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add Expert
          </Link>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={updateSearch}
        placeholder="Search experts by name, skill, or country..."
        className="max-w-xl mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-800" />
                <div className="flex-1">
                  <div className="h-4 bg-surface-800 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-surface-800 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-surface-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-400 text-lg mb-2">No experts found</p>
          <p className="text-surface-500 text-sm mb-6">Try adjusting your search.</p>
          {user && (
            <Link to="/experts/new" className="btn-primary text-sm inline-flex">
              <Plus className="w-4 h-4" />
              Add your profile
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-surface-500 mb-4">
            {total !== null ? (
              <>Showing {experts.length} of {total} expert{total !== 1 ? 's' : ''}</>
            ) : (
              <>{experts.length} expert{experts.length !== 1 ? 's' : ''} found</>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary text-sm min-w-[160px]"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}

          {!hasMore && experts.length > PAGE_SIZE && (
            <p className="text-center text-sm text-surface-600 mt-10">
              All {experts.length} experts loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
