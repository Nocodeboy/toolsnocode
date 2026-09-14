import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Category, Tool } from '../types';
import ToolCard from '../components/ui/ToolCard';
import NotFoundPage from './NotFoundPage';
import { CATEGORY_COPY } from '../data/categoryCopy';
import { BASE_URL, useSEO } from '../hooks/useSEO';

const PAGE_SIZE = 24;

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
] as const;

/**
 * `/categories/:slug`.
 *
 * Hasta ahora una categoría solo existía como `/tools?category=marketing`: un
 * filtro con el <title> genérico de la página de listado, canónica a `/tools` y
 * cero texto propio. Es decir, 33 nichos de búsqueda con intención clarísima
 * ("ai marketing tools") que el sitio no tenía forma de ganar porque no tenía
 * una página que los respondiera.
 *
 * El texto de `categoryCopy.ts` no está aquí para rellenar: es lo único que
 * distingue esta página de un listado filtrado. Sin él, publicar 33 URLs más
 * sería exactamente el mismo error que las 12.000 fichas vacías que se acaban
 * de sacar del sitemap.
 */
export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [category, setCategory] = useState<Category | null>(null);
  const [siblings, setSiblings] = useState<Category[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(0);

  const sortBy = searchParams.get('sort') === 'newest' ? 'newest' : 'trending';

  // Una categoría nueva en la base de datos no puede dejar la página sin <title>
  // ni sin descripción: el copy editorial es lo deseable, no lo imprescindible.
  const copy = useMemo(() => {
    if (!slug) return null;
    const authored = CATEGORY_COPY[slug];
    if (authored) return authored;
    if (!category) return null;
    return {
      heading: `${category.name} Tools`,
      metaTitle: `${category.name} Tools`,
      metaDescription:
        category.description ||
        `Browse and compare ${category.name.toLowerCase()} tools in the ToolsNoCode directory.`,
      intro: category.description || '',
    };
  }, [slug, category]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategory() {
      if (!slug) return;
      setLoading(true);
      setNotFound(false);
      setCategory(null);
      setTools([]);
      setTotal(null);
      setPage(0);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        // Un fallo de red no es un 404: marcarlo como tal dejaría la página en
        // noindex por un error pasajero.
        setNotFound(!error);
        setLoading(false);
        return;
      }

      setCategory(data);
    }

    loadCategory();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    if (!category) return;

    async function loadTools() {
      setLoading(true);
      const query = supabase
        .from('tools')
        .select('*, category:categories(*)', { count: 'exact' })
        .eq('category_id', category!.id);

      // El boost no se ancla arriba en "Trending" por el mismo motivo que en
      // /tools: si lo comprado sale primero, la señal deja de valer.
      const ordered = sortBy === 'newest'
        ? query.order('is_boosted', { ascending: false }).order('created_at', { ascending: false })
        : query.order('trending_score', { ascending: false }).order('created_at', { ascending: false });

      const { data, count } = await ordered.range(0, PAGE_SIZE - 1);
      if (cancelled) return;

      setTools(data || []);
      setTotal(count ?? null);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(0);
      setLoading(false);
    }

    loadTools();
    return () => { cancelled = true; };
  }, [category, sortBy]);

  useEffect(() => {
    if (!category) return;
    supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .neq('id', category.id)
      .order('sort_order')
      .then(({ data }) => { if (data) setSiblings(data); });
  }, [category]);

  const path = `/categories/${slug}`;

  const jsonLd = useMemo(() => {
    if (!category || !copy) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: copy.heading,
        url: `${BASE_URL}${path}`,
        description: copy.metaDescription,
        ...(total !== null
          ? {
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: total,
                itemListElement: tools.slice(0, 20).map((tool, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  url: `${BASE_URL}/tools/${tool.slug}`,
                  name: tool.name,
                })),
              },
            }
          : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE_URL}/categories` },
          { '@type': 'ListItem', position: 3, name: category.name, item: `${BASE_URL}${path}` },
        ],
      },
    ];
  }, [category, copy, path, total, tools]);

  // `NotFoundPage` llama a su vez a `useSEO`, y los efectos de un hijo corren
  // antes que los del padre: sin este ternario la página 404 acabaría con el
  // <title> por defecto del sitio, pisado desde aquí un instante después.
  useSEO({
    title: notFound ? 'Page Not Found' : copy?.metaTitle,
    description: notFound
      ? 'The category you are looking for does not exist or has been moved.'
      : copy?.metaDescription,
    // La canónica nunca lleva `?sort=`: son la misma página ordenada distinto.
    url: path,
    noindex: notFound,
    jsonLd,
  });

  async function loadMore() {
    if (loadingMore || !hasMore || !category) return;
    setLoadingMore(true);
    const next = page + 1;
    const from = next * PAGE_SIZE;

    const query = supabase
      .from('tools')
      .select('*, category:categories(*)')
      .eq('category_id', category.id);

    const ordered = sortBy === 'newest'
      ? query.order('is_boosted', { ascending: false }).order('created_at', { ascending: false })
      : query.order('trending_score', { ascending: false }).order('created_at', { ascending: false });

    const { data } = await ordered.range(from, from + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      setTools((prev) => [...prev, ...data]);
      setPage(next);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  if (notFound) return <NotFoundPage />;

  const paragraphs = copy?.intro ? copy.intro.split('\n\n').filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-surface-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-surface-300 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/categories" className="hover:text-surface-300 transition-colors">Categories</Link>
        {category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-300">{category.name}</span>
          </>
        )}
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          {copy?.heading ?? <span className="inline-block h-9 w-80 max-w-full bg-surface-800 rounded animate-pulse" />}
        </h1>
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-surface-400 leading-relaxed mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pt-6 border-t border-surface-800">
        <p className="text-sm text-surface-500">
          {total !== null
            ? <>{total} tool{total !== 1 ? 's' : ''} in {category?.name ?? 'this category'}</>
            : 'Loading tools…'}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-900 border border-surface-800">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  if (opt.value === 'trending') params.delete('sort');
                  else params.set('sort', opt.value);
                  setSearchParams(params, { replace: true });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sortBy === opt.value ? 'bg-surface-800 text-white' : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {user && (
            <Link to="/tools/new" className="btn-secondary text-sm shrink-0">
              <Plus className="w-4 h-4" />
              Add Tool
            </Link>
          )}
        </div>
      </div>

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
        <div className="text-center py-16">
          <p className="text-surface-400 mb-2">Nothing listed here yet.</p>
          <p className="text-surface-500 text-sm mb-6">
            This category is waiting for its first tool.
          </p>
          <Link to="/tools" className="btn-secondary text-sm inline-flex">Browse all tools</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button onClick={loadMore} disabled={loadingMore} className="btn-secondary text-sm min-w-[160px]">
                {loadingMore
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                  : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {siblings.length > 0 && (
        <section className="mt-16 pt-8 border-t border-surface-800">
          <h2 className="text-lg font-semibold text-white mb-4">Other categories</h2>
          {/* Enlazado interno plano: desde cualquier categoría se llega a las
              otras 32 en un clic, y a la ficha de cualquier herramienta en dos. */}
          <div className="flex flex-wrap gap-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                to={`/categories/${sibling.slug}`}
                className="badge-neutral hover:text-white hover:border-surface-600 transition-colors"
              >
                {sibling.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
