import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, BookOpen, Rocket, Search, TrendingUp, Zap, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tool, Category } from '../types';
import ToolCard from '../components/ui/ToolCard';
import ToolRow from '../components/ui/ToolRow';
import SectionHeader from '../components/ui/SectionHeader';
import { useSEO, BASE_URL } from '../hooks/useSEO';
import { STRIPE_PRODUCTS } from '../stripe-config';

// El precio estaba escrito a mano en dos sitios de esta página. Sale del mismo
// sitio que el checkout o acabará diciendo una cifra que nadie cobra.
// Una fila de "Trending" con una sola tarjeta no es una sección, es un hueco.
// Por debajo de esto la portada la omite: el dato existe, pero no da para
// destacar nada todavía.
const MIN_TRENDING = 3;

const boost = STRIPE_PRODUCTS[0];
const boostPrice = boost
  ? `$${boost.price.toFixed(2)}/${boost.mode === 'subscription' ? 'yr' : 'once'}`
  : '';

export default function HomePage() {
  const [boostedTools, setBoostedTools] = useState<Tool[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Tool[]>([]);
  const [newestTools, setNewestTools] = useState<Tool[]>([]);
  const [trendingTools, setTrendingTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Array<Category & { tool_count: number }>>([]);
  const [stats, setStats] = useState({ tools: 0, experts: 0, tutorials: 0, projects: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const highlightedJsonLd = useMemo(() => {
    const highlighted = [...boostedTools, ...editorsPicks];
    if (highlighted.length === 0) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Highlighted AI & No-Code Tools',
      itemListElement: highlighted.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/tools/${t.slug}`,
        name: t.name,
      })),
    };
  }, [boostedTools, editorsPicks]);

  useSEO({
    title: 'AI & No-Code Tools Directory',
    url: '/',
    type: 'website',
    jsonLd: highlightedJsonLd,
  });

  useEffect(() => {
    async function load() {
      try {
        const [boostedRes, pickRes, newestRes, trendingRes, catRes, countRes, toolCount, expertCount, tutorialCount, projectCount] =
          await Promise.all([
            supabase.from('tools').select('*').eq('is_boosted', true).order('boost_expires_at', { ascending: false }).limit(6),
            supabase.from('tools').select('*').eq('is_featured', true).eq('is_boosted', false).order('created_at', { ascending: false }).limit(6),
            supabase.from('tools').select('*, category:categories(*)').order('created_at', { ascending: false }).limit(8),
            // `.gt('trending_score', 0)` es la diferencia entre una sección y un
            // duplicado. Con todos los scores a cero esta consulta ordenaba por
            // `created_at` y devolvía exactamente lo mismo que "Recently Added":
            // cinco de seis herramientas, en el mismo orden, una sección más
            // abajo. Ahora, sin datos de comportamiento, no devuelve nada y la
            // sección no se dibuja.
            supabase.from('tools').select('*, category:categories(*)').gt('trending_score', 0).order('trending_score', { ascending: false }).limit(6),
            // Dos consultas y se juntan aquí: PostgREST no infiere la relación
            // entre `categories` y la vista `category_tool_counts`, así que el
            // embebido `!inner(...)` devuelve un array vacío sin dar error.
            supabase.from('categories').select('*').is('parent_id', null),
            supabase.from('category_tool_counts').select('category_id, tool_count'),
            supabase.from('tools').select('id', { count: 'exact', head: true }),
            supabase.from('experts').select('id', { count: 'exact', head: true }),
            supabase.from('tutorials').select('id', { count: 'exact', head: true }),
            supabase.from('projects').select('id', { count: 'exact', head: true }),
          ]);

        if (boostedRes.data) setBoostedTools(boostedRes.data);
        if (pickRes.data) setEditorsPicks(pickRes.data);
        if (newestRes.data) setNewestTools(newestRes.data);
        if (trendingRes.data) setTrendingTools(trendingRes.data);
        if (catRes.data) {
          const counts = new Map<string, number>(
            (countRes.data ?? []).map((r) => [r.category_id as string, r.tool_count as number]),
          );
          // Por tamaño: la home enseña por dónde hay algo que mirar, no el orden
          // en que se crearon las categorías.
          setCategories(
            catRes.data
              .map((c) => ({ ...c, tool_count: counts.get(c.id) ?? 0 }))
              .sort((a, b) => b.tool_count - a.tool_count),
          );
        }
        setStats({
          tools: toolCount.count || 0,
          experts: expertCount.count || 0,
          tutorials: tutorialCount.count || 0,
          projects: projectCount.count || 0,
        });
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tools?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-sm text-brand-400 font-medium">The AI Builder Economy starts here</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
              Discover the Best{' '}
              <span className="text-gradient">AI & No-Code</span>{' '}
              Tools
            </h1>

            <p className="text-lg sm:text-xl text-surface-400 leading-relaxed mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Find tools, compare stacks, learn from tutorials, connect with experts, and showcase your projects. All in one place.
            </p>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI tools, no-code platforms, automation..."
                className="w-full pl-12 pr-32 py-4 bg-surface-900/80 border border-surface-700/50 rounded-2xl text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-base"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-sm">
                Search
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-surface-500 mt-10 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-400" />
                <span><strong className="text-surface-200">{stats.tools}</strong> Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span><strong className="text-surface-200">{stats.experts}</strong> Experts</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span><strong className="text-surface-200">{stats.tutorials}</strong> Tutorials</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-rose-400" />
                <span><strong className="text-surface-200">{stats.projects}</strong> Projects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La tira de categorías va aquí, pegada al hero: es navegación, y la
          navegación se pone donde alguien acaba de decidir que no va a escribir
          en el buscador. Antes eran 33 iconos idénticos en verde a mitad de
          página, que a esa escala no se leen como 33 destinos sino como textura. */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.slice(0, 10).map((cat, i) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                // Diez pastillas son seis filas en un móvil de 390px: toda la
                // primera pantalla después del hero gastada en navegación. Seis
                // caben en dos.
                className={`group items-center gap-2 px-3.5 py-2 rounded-full bg-surface-900/70 border border-surface-800 hover:border-surface-600 hover:bg-surface-900 transition-colors ${
                  i >= 6 ? 'hidden sm:inline-flex' : 'inline-flex'
                }`}
              >
                <span className="text-sm text-surface-200 group-hover:text-white transition-colors">{cat.name}</span>
                <span className="text-xs text-surface-600 tabular-nums">{cat.tool_count}</span>
              </Link>
            ))}
            <Link
              to="/categories"
              className="inline-flex items-center gap-1 px-3.5 py-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              All {categories.length} categories
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {boostedTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionHeader
            title="Boosted"
            subtitle="Paid placement by the people who made them"
            icon={Rocket}
            tone="violet"
            href="/tools?sort=boosted"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boostedTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {editorsPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionHeader
            title="Editor's Picks"
            subtitle="Hand-selected by our team"
            icon={Sparkles}
            tone="amber"
            href="/tools?sort=featured"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editorsPicks.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {newestTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionHeader
            title="Recently Added"
            subtitle="The latest tools in the directory"
            icon={Clock}
            tone="brand"
            href="/tools?sort=newest"
          />
          {/* Lista, no rejilla. Tres rejillas de tarjetas seguidas son el mismo
              bloque tres veces; a esta distancia el color del icono de la
              cabecera no las distingue. Una lista es otra forma, y además cabe
              la categoría y la fecha, que en la tarjeta no se ven. */}
          <div className="divide-y divide-surface-800/60">
            {newestTools.map((tool) => (
              <ToolRow key={tool.id} tool={tool} showDate />
            ))}
          </div>
        </section>
      )}

      {/* Sin `trending_score > 0` esta sección no existe. No es una decisión de
          diseño: la consulta filtra por comportamiento real, y mientras no lo
          haya no hay nada que enseñar que no esté ya en "Recently Added". */}
      {trendingTools.length >= MIN_TRENDING && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionHeader
            title="Trending"
            subtitle="What people are actually opening this week"
            icon={TrendingUp}
            tone="sky"
            href="/tools?sort=trending"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Un solo bloque de conversión, al final. Antes había tres llamadas a
          /pricing en la misma página: el banner grande de en medio, esta
          tarjeta, y la propia sección de Boosted. Repetir la petición no la
          hace más convincente, solo más difícil de ignorar el resto. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid sm:grid-cols-2 gap-px bg-surface-800/60 rounded-2xl overflow-hidden border border-surface-800/60">
          <Link to="/tools/new" className="group bg-surface-950 hover:bg-surface-900/70 transition-colors p-7 sm:p-8">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-base font-semibold text-white mb-1.5">Submit your tool — it's free</p>
            <p className="text-sm text-surface-500 leading-relaxed mb-4">
              {stats.tools.toLocaleString()} tools are listed. Adding yours takes a few minutes and costs nothing.
            </p>
            <span className="text-sm font-medium text-brand-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Add your tool <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link to="/pricing" className="group bg-surface-950 hover:bg-surface-900/70 transition-colors p-7 sm:p-8">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Rocket className="w-4 h-4 text-violet-300" />
            </div>
            <p className="text-base font-semibold text-white mb-1.5">Already listed? Boost it</p>
            <p className="text-sm text-surface-500 leading-relaxed mb-4">
              A full-width card at the top of every listing, a demo video on your page, and the numbers behind it.
            </p>
            <span className="text-sm font-medium text-violet-300 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              See Boost — {boostPrice} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}