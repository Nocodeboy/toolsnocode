import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';
import { BASE_URL, useSEO } from '../hooks/useSEO';

interface CategoryWithCount extends Category {
  tool_count: number;
}

/**
 * `/categories`.
 *
 * La home ya pintaba una rejilla de categorías, pero enlazaba a
 * `/tools?category=…` y solo mostraba unas pocas. Esta es la página que reparte
 * autoridad hacia las 33 fichas de categoría y, de paso, el único sitio del
 * sitio donde se ve el tamaño real de cada una.
 *
 * Los recuentos salen de la vista `category_tool_counts` en una sola petición.
 * La alternativa era un `count=exact` por categoría: 33 round-trips para pintar
 * una rejilla.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [catRes, countRes] = await Promise.all([
        supabase.from('categories').select('*').is('parent_id', null).order('sort_order'),
        supabase.from('category_tool_counts').select('category_id, tool_count'),
      ]);

      const counts = new Map<string, number>(
        (countRes.data ?? []).map((row) => [row.category_id as string, row.tool_count as number]),
      );

      setCategories(
        (catRes.data ?? []).map((cat) => ({ ...cat, tool_count: counts.get(cat.id) ?? 0 })),
      );
      setLoading(false);
    }
    load();
  }, []);

  // Por tamaño, no por `sort_order`: quien llega a esta página quiere saber
  // dónde hay algo que mirar, y una categoría de 6 herramientas arriba del todo
  // solo gasta el primer clic.
  const sorted = useMemo(
    () => [...categories].sort((a, b) => b.tool_count - a.tool_count),
    [categories],
  );

  const jsonLd = useMemo(() => {
    if (sorted.length === 0) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI & No-Code Tool Categories',
      url: `${BASE_URL}/categories`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: sorted.length,
        itemListElement: sorted.map((cat, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE_URL}/categories/${cat.slug}`,
          name: cat.name,
        })),
      },
    };
  }, [sorted]);

  useSEO({
    title: 'Tool Categories',
    description:
      'Every category in the directory, from marketing and automation to 3D and cybersecurity, with the number of tools listed in each and a guide to what belongs where.',
    url: '/categories',
    jsonLd,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-surface-500 mb-6">
        <Link to="/" className="hover:text-surface-300 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-300">Categories</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          AI &amp; No-Code Tool Categories
        </h1>
        <p className="text-surface-400 leading-relaxed">
          Every tool in the directory sits in exactly one category. Each page below explains what
          that category actually covers, how the tools in it differ from one another, and what to
          check before you commit to one — then lists everything filed under it.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="glass-card-hover p-5 group block"
            >
              <h2 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors mb-1">
                {cat.name}
              </h2>
              <p className="text-xs text-surface-500">
                {cat.tool_count} tool{cat.tool_count !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
