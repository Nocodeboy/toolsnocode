import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, BookOpen, Rocket, Search, TrendingUp, Zap, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tool, Category } from '../types';
import ToolCard from '../components/ui/ToolCard';
import CategoryCard from '../components/ui/CategoryCard';
import { useSEO, BASE_URL } from '../hooks/useSEO';

export default function HomePage() {
  const [boostedTools, setBoostedTools] = useState<Tool[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Tool[]>([]);
  const [newestTools, setNewestTools] = useState<Tool[]>([]);
  const [trendingTools, setTrendingTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    url: '/',
    type: 'website',
    jsonLd: highlightedJsonLd,
  });

  useEffect(() => {
    async function load() {
      try {
        const [boostedRes, pickRes, newestRes, trendingRes, catRes, toolCount, expertCount, tutorialCount, projectCount] =
          await Promise.all([
            supabase.from('tools').select('*').eq('is_boosted', true).order('boost_expires_at', { ascending: false }).limit(6),
            supabase.from('tools').select('*').eq('is_featured', true).eq('is_boosted', false).order('created_at', { ascending: false }).limit(6),
            supabase.from('tools').select('*').order('is_boosted', { ascending: false }).order('created_at', { ascending: false }).limit(6),
            supabase.from('tools').select('*').order('trending_score', { ascending: false }).order('created_at', { ascending: false }).limit(6),
            supabase.from('categories').select('*').is('parent_id', null).order('sort_order'),
            supabase.from('tools').select('id', { count: 'exact', head: true }),
            supabase.from('experts').select('id', { count: 'exact', head: true }),
            supabase.from('tutorials').select('id', { count: 'exact', head: true }),
            supabase.from('projects').select('id', { count: 'exact', head: true }),
          ]);

        if (boostedRes.data) setBoostedTools(boostedRes.data);
        if (pickRes.data) setEditorsPicks(pickRes.data);
        if (newestRes.data) setNewestTools(newestRes.data);
        if (trendingRes.data) setTrendingTools(trendingRes.data);
        if (catRes.data) setCategories(catRes.data);
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

      {boostedTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-b from-brand-500/[0.06] via-transparent to-transparent p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/[0.08] via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Boosted Tools</h2>
                    <p className="text-sm text-surface-400 mt-0.5">Sponsored picks from the community</p>
                  </div>
                </div>
                <Link to="/tools?sort=boosted" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boostedTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {editorsPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editor's Picks</h2>
                <p className="text-sm text-surface-400 mt-0.5">Hand-selected by our team</p>
              </div>
            </div>
            <Link to="/tools?sort=featured" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editorsPicks.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Browse Categories</h2>
            <Link to="/tools" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link
          to="/pricing"
          className="block group relative overflow-hidden rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-500/10 via-surface-900/60 to-emerald-500/10 hover:border-brand-500/45 hover:from-brand-500/15 hover:to-emerald-500/15 transition-all duration-300 p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-500/8 via-transparent to-transparent" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold text-white">
                    Is your tool listed here?
                  </p>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                    <Star className="w-3 h-3 text-brand-400 fill-brand-400/30" />
                    <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide">Boost Plan</span>
                  </span>
                </div>
                <p className="text-sm text-surface-400 leading-relaxed">
                  Boost it to appear first in every listing, on the homepage Featured section, and in search results.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="hidden sm:block text-sm text-surface-500">from $49.90/yr</span>
              <span className="btn-primary text-sm py-2 px-4 group-hover:scale-105 transition-transform">
                Boost My Tool
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {newestTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Recently Added</h2>
                <p className="text-sm text-surface-500 mt-0.5">The latest tools in the directory</p>
              </div>
            </div>
            <Link to="/tools?sort=newest" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newestTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {trendingTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                <p className="text-sm text-surface-500 mt-0.5">Most popular this week</p>
              </div>
            </div>
            <Link to="/tools?sort=trending" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Submit your tool CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/tools/new"
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 to-surface-900/60 hover:border-emerald-500/35 transition-all duration-300 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">Submit your tool — it's free</p>
                <p className="text-xs text-surface-500 leading-relaxed mb-3">Get discovered by thousands of builders looking for tools like yours.</p>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Add your tool <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            to="/pricing"
            className="group relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/8 to-surface-900/60 hover:border-brand-500/35 transition-all duration-300 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">Already listed? Boost it</p>
                <p className="text-xs text-surface-500 leading-relaxed mb-3">Priority positioning, featured placement, demo video, and analytics. From $49.90/yr.</p>
                <span className="text-xs font-semibold text-brand-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  See Boost plans <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="glass-card p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-500/5" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to discover your next stack?
            </h2>
            <p className="text-surface-400 mb-8 max-w-lg mx-auto">
              Explore thousands of AI and no-code tools. Find the perfect combination for your next project.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/tools" className="btn-primary">
                <Search className="w-4 h-4" />
                Explore Tools
              </Link>
              <Link to="/experts" className="btn-secondary">
                <Users className="w-4 h-4" />
                Find Experts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}