import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tool, Category } from '../types';
import ToolCard from '../components/ui/ToolCard';
import SearchBar from '../components/ui/SearchBar';
import { useSEO } from '../hooks/useSEO';

const PAGE_SIZE = 24;
const pricingOptions = ['all', 'free', 'freemium', 'paid', 'enterprise'] as const;
// Se han retirado "Highest Rated" y "Most Upvoted": ambos ordenaban por datos
// sembrados (60 tools con upvotes de ejemplo, 0 de 200 tools de makers con
// rating), así que dejaban a toda herramienta real por detrás de las de muestra.
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'trending', label: 'Trending' },
  { value: 'boosted', label: 'Boosted' },
  { value: 'featured', label: "Editor's Picks" },
] as const;

export default function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const pageRef = useRef(0);
  const { user } = useAuth();

  useSEO({
    title: 'AI & No-Code Tools',
    description: 'Browse and compare the best AI and no-code tools. Filter by category, pricing, and difficulty level to find your perfect stack.',
    url: '/tools',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI & No-Code Tools',
      url: 'https://toolsnocode.com/tools',
      description: 'Browse and compare the best AI and no-code tools. Filter by category, pricing, and difficulty level to find your perfect stack.',
    },
  });

  const search = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || 'all';
  const pricingFilter = searchParams.get('pricing') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    supabase.from('categories').select('*').is('parent_id', null).order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const buildQuery = useCallback((from: number, to: number) => {
    let query = supabase.from('tools').select('*, category:categories(*)', { count: 'exact' });

    if (pricingFilter !== 'all') {
      query = query.eq('pricing', pricingFilter);
    }

    if (categoryFilter !== 'all') {
      const matchingCat = categories.find((c) => c.slug === categoryFilter);
      if (matchingCat) {
        query = query.eq('category_id', matchingCat.id);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,tagline.ilike.%${search}%`);
    }

    if (sortBy === 'trending') {
      // El trending se gana, no se compra: aquí no se ancla lo boosteado arriba,
      // o la sección dejaría de significar nada (y con ella el propio Boost).
      // Mientras `tool_events` acumula datos todos los scores son 0 y el orden
      // degrada solo a "más recientes", que es lo honesto sin datos.
      query = query.order('trending_score', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'boosted') {
      query = query.eq('is_boosted', true).order('boost_expires_at', { ascending: false });
    } else if (sortBy === 'featured') {
      query = query.eq('is_featured', true).eq('is_boosted', false).order('created_at', { ascending: false });
    } else {
      query = query.order('is_boosted', { ascending: false }).order('created_at', { ascending: false });
    }

    return query.range(from, to);
  }, [pricingFilter, categoryFilter, sortBy, search, categories]);

  useEffect(() => {
    if (categories.length === 0 && categoryFilter !== 'all') return;

    async function load() {
      setLoading(true);
      pageRef.current = 0;
      const { data, count } = await buildQuery(0, PAGE_SIZE - 1);
      setTools(data || []);
      setTotal(count ?? null);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setLoading(false);
    }
    load();
  }, [buildQuery, categoryFilter, categories]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await buildQuery(from, to);
    if (data && data.length > 0) {
      setTools((prev) => [...prev, ...data]);
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

  const activeFilterCount = [
    categoryFilter !== 'all' ? 1 : 0,
    pricingFilter !== 'all' ? 1 : 0,
    sortBy !== 'newest' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tools Directory</h1>
          <p className="text-surface-400">
            Discover and compare the best AI and no-code tools for your projects.
          </p>
        </div>
        {user && (
          <Link to="/tools/new" className="btn-primary text-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add Tool
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={(v) => updateParam('q', v)}
          placeholder="Search tools..."
          className="flex-1"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary text-sm relative ${showFilters ? 'border-brand-500/50 text-brand-400' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="glass-card p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-200">Filters</h3>
            <button
              onClick={() => {
                setSearchParams({});
                setShowFilters(false);
              }}
              className="text-xs text-surface-500 hover:text-surface-300 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => updateParam('category', e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Pricing</label>
              <select
                value={pricingFilter}
                onChange={(e) => updateParam('pricing', e.target.value)}
                className="input-field text-sm"
              >
                {pricingOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt === 'all' ? 'All Pricing' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field text-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800" />
                <div className="flex-1">
                  <div className="h-4 bg-surface-800 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-surface-800 rounded w-full mb-1" />
                  <div className="h-3 bg-surface-800 rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-400 text-lg mb-2">No tools found</p>
          <p className="text-surface-500 text-sm mb-6">Try adjusting your search or filters.</p>
          {user && (
            <Link to="/tools/new" className="btn-primary text-sm inline-flex">
              <Plus className="w-4 h-4" />
              Add the first tool
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-surface-500 mb-4">
            {total !== null ? (
              <>Showing {tools.length} of {total} tool{total !== 1 ? 's' : ''}</>
            ) : (
              <>{tools.length} tool{tools.length !== 1 ? 's' : ''} found</>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
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

          {!hasMore && tools.length > PAGE_SIZE && (
            <p className="text-center text-sm text-surface-600 mt-10">
              All {tools.length} tools loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
