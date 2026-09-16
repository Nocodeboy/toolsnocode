import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tutorial } from '../types';
import TutorialCard from '../components/ui/TutorialCard';
import SearchBar from '../components/ui/SearchBar';
import { useSEO } from '../hooks/useSEO';
import { ilikeAny } from '../lib/search';

const PAGE_SIZE = 24;
const contentTypes = ['all', 'video', 'guide', 'course', 'article'] as const;
const levels = ['all', 'beginner', 'intermediate', 'advanced'] as const;

export default function TutorialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const pageRef = useRef(0);
  const { user } = useAuth();

  useSEO({
    title: 'No-Code & AI Tutorials',
    description: 'Learn no-code and AI with step-by-step tutorials, video guides, and courses. Filter by tool, format, and difficulty level.',
    url: '/tutorials',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'No-Code & AI Tutorials',
      url: 'https://toolsnocode.com/tutorials',
      description: 'Learn no-code and AI with step-by-step tutorials, video guides, and courses. Filter by tool, format, and difficulty level.',
    },
  });

  const search = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'all';
  const levelFilter = searchParams.get('level') || 'all';

  const buildQuery = useCallback((from: number, to: number) => {
    let query = supabase
      .from('tutorials')
      .select('*, tool:tools(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (typeFilter !== 'all') {
      query = query.eq('content_type', typeFilter);
    }
    if (levelFilter !== 'all') {
      query = query.eq('difficulty_level', levelFilter);
    }
    if (search) {
      query = query.or(ilikeAny(['title', 'description', 'author_name'], search));
    }

    return query.range(from, to);
  }, [typeFilter, levelFilter, search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      pageRef.current = 0;
      const { data, count } = await buildQuery(0, PAGE_SIZE - 1);
      setTutorials(data || []);
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
      setTutorials((prev) => [...prev, ...data]);
      pageRef.current = nextPage;
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tutorials & Guides</h1>
          <p className="text-surface-400">
            Learn how to use the best AI and no-code tools with step-by-step tutorials.
          </p>
        </div>
        {user && (
          <Link to="/tutorials/new" className="btn-primary text-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add Tutorial
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <SearchBar
          value={search}
          onChange={(v) => updateParam('q', v)}
          placeholder="Search tutorials..."
          className="flex-1"
        />
        <select
          value={typeFilter}
          onChange={(e) => updateParam('type', e.target.value)}
          className="input-field text-sm sm:w-40"
        >
          {contentTypes.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => updateParam('level', e.target.value)}
          className="input-field text-sm sm:w-40"
        >
          {levels.map((l) => (
            <option key={l} value={l}>{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-surface-800" />
              <div className="p-5">
                <div className="h-3 bg-surface-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-surface-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-400 text-lg mb-2">No tutorials found</p>
          <p className="text-surface-500 text-sm mb-6">Try adjusting your search or filters.</p>
          {user && (
            <Link to="/tutorials/new" className="btn-primary text-sm inline-flex">
              <Plus className="w-4 h-4" />
              Add the first tutorial
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-surface-500 mb-4">
            {total !== null ? (
              <>Showing {tutorials.length} of {total} tutorial{total !== 1 ? 's' : ''}</>
            ) : (
              <>{tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} found</>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
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

          {!hasMore && tutorials.length > PAGE_SIZE && (
            <p className="text-center text-sm text-surface-600 mt-10">
              All {tutorials.length} tutorials loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
