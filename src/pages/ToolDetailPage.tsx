import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ExternalLink, TrendingUp, Globe,
  Tag, BarChart3, Clock, BookOpen, Users, Rocket, Pencil, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackToolEvent } from '../lib/events';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from '../components/ui/FavoriteButton';
import ClaimButton from '../components/ui/ClaimButton';
import UpvoteButton from '../components/ui/UpvoteButton';
import VerifyToolButton from '../components/ui/VerifyToolButton';
import type { Tool, Tutorial, Expert, Project } from '../types';
import { useSEO } from '../hooks/useSEO';
import { parseVideoUrl } from '../lib/video';

export default function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [tool, setTool] = useState<Tool | null>(null);
  const [alternatives, setAlternatives] = useState<Tool[]>([]);

  const handleClaimed = () => {
    setTool((prev) => prev ? { ...prev, user_id: user?.id } : prev);
  };
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const demoVideo = useMemo(
    () => (tool?.is_boosted && tool.video_url ? parseVideoUrl(tool.video_url) : null),
    [tool?.is_boosted, tool?.video_url],
  );

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (!toolData) {
        setNotFound(!toolError);
        setLoading(false);
        return;
      }

      setTool(toolData);
      trackToolEvent('detail_view', toolData.id);

      const [altRes, tutRes, expertRes, projRes] = await Promise.all([
        // "alternativas a X" es de las búsquedas con más intención de compra del
        // sector, y sale entera de datos propios. Se ordena por comportamiento
        // real y luego por novedad, no por el orden en que entraron en la tabla.
        supabase
          .from('tools')
          .select('*')
          .eq('category_id', toolData.category_id)
          .neq('id', toolData.id)
          .order('trending_score', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('tutorials').select('*').eq('tool_id', toolData.id).limit(4),
        supabase
          .from('expert_tools')
          .select('expert:experts(*)')
          .eq('tool_id', toolData.id)
          .limit(4),
        supabase
          .from('project_tools')
          .select('project:projects(*)')
          .eq('tool_id', toolData.id)
          .limit(4),
      ]);

      if (altRes.data) setAlternatives(altRes.data);
      if (tutRes.data) setTutorials(tutRes.data);
      if (expertRes.data) {
        const mapped = expertRes.data
          .map((row) => row.expert as unknown as Expert)
          .filter(Boolean);
        setExperts(mapped);
      }
      if (projRes.data) {
        const mapped = projRes.data
          .map((row) => row.project as unknown as Project)
          .filter(Boolean);
        setProjects(mapped);
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!tool) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: 'https://toolsnocode.com/tools' },
          { '@type': 'ListItem', position: 2, name: tool.name },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description || tool.tagline,
        url: tool.website || `https://toolsnocode.com/tools/${tool.slug}`,
        applicationCategory: tool.category?.name || 'WebApplication',
        // Solo se declara Offer cuando hay un precio real que declarar: un Offer
        // sin `price` es inválido, y es lo que se emitía para toda tool de pago.
        ...(tool.pricing === 'free'
          ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/OnlineOnly' } }
          : {}),
        // Sin `aggregateRating`: esas puntuaciones son del scraper y no hay ni una
        // reseña visible en la página. Marcar datos estructurados de valoración
        // que el usuario no puede ver es causa documentada de acción manual.
      },
    ];
  }, [tool]);

  // Se declara aparte de `jsonLd` porque depende de `alternatives`, que llega en
  // una segunda consulta: mezclarlo arriba reharía el bloque entero en cada carga.
  const alternativesLd = useMemo(() => {
    if (!tool || alternatives.length === 0) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${tool.name} alternatives`,
      numberOfItems: alternatives.length,
      itemListElement: alternatives.map((alt, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: alt.name,
        url: `https://toolsnocode.com/tools/${alt.slug}`,
      })),
    };
  }, [tool, alternatives]);

  useSEO({
    title: tool ? `${tool.name} - ${tool.tagline}` : undefined,
    description: tool ? tool.description?.slice(0, 160) || tool.tagline : undefined,
    image: tool?.logo_url || tool?.screenshot_urls?.[0],
    url: tool ? `/tools/${tool.slug}` : undefined,
    type: 'website',
    jsonLd: alternativesLd && jsonLd ? [...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]), alternativesLd] : jsonLd,
    // Un slug inexistente devuelve 200 con la shell del SPA: sin esto sería un soft-404.
    noindex: notFound,
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-surface-800 rounded w-24" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl" />
            <div>
              <div className="h-7 bg-surface-800 rounded w-48 mb-2" />
              <div className="h-4 bg-surface-800 rounded w-72" />
            </div>
          </div>
          <div className="h-40 bg-surface-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Tool not found</h1>
        <Link to="/tools" className="btn-primary">Back to Tools</Link>
      </div>
    );
  }

  const pricingColor: Record<string, string> = {
    free: 'text-brand-400',
    freemium: 'text-sky-400',
    paid: 'text-amber-400',
    enterprise: 'text-rose-400',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/tools" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Tools
      </Link>

      <div className="glass-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-800 border border-surface-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover rounded-2xl" loading="lazy" />
            ) : (
              <span className="text-2xl font-bold text-surface-400">{tool.name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{tool.name}</h1>
              {tool.trending_score > 0 && (
                <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" /> Trending
                </span>
              )}
              {tool.is_featured && (
                <span className="badge-green">Featured</span>
              )}
              {tool.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/20">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <p className="text-lg text-surface-300 mb-4">{tool.tagline}</p>

            <div className="flex flex-wrap items-center gap-4 mb-5">
              <UpvoteButton itemType="tools" itemId={tool.id} initialCount={tool.upvotes} showCount={false} />
              <span className={`text-sm font-medium capitalize ${pricingColor[tool.pricing] || ''}`}>
                {tool.pricing}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackToolEvent('outbound_click', tool.id)}
                  className="btn-primary text-sm"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {user?.id === tool.user_id && (
                <Link to={`/tools/${tool.slug}/edit`} className="btn-secondary text-sm">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
              )}
              <FavoriteButton
                isFavorite={isFavorite('tools', tool.id)}
                onToggle={() => toggleFavorite('tools', tool.id)}
              />
            </div>

            {!tool.user_id && (
              <ClaimButton itemType="tools" itemId={tool.id} itemName={tool.name} itemWebsite={tool.website} onClaimed={handleClaimed} />
            )}

            {user?.id === tool.user_id && !tool.is_verified && tool.website && (
              <VerifyToolButton
                toolId={tool.id}
                toolName={tool.name}
                toolWebsite={tool.website}
                initialToken={tool.verification_token}
                initialVerified={tool.is_verified ?? false}
                onVerified={() => setTool((prev) => prev ? { ...prev, is_verified: true } : prev)}
              />
            )}

            {user?.id === tool.user_id && !tool.is_boosted && (
              <Link
                to={`/pricing?tool=${tool.id}`}
                className="mt-3 flex items-center gap-3 w-full p-3.5 rounded-xl bg-gradient-to-r from-brand-500/10 to-emerald-500/8 border border-brand-500/20 hover:border-brand-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-200">Boost this tool</p>
                  <p className="text-xs text-surface-500">Priority ranking, featured badge, demo video & more</p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {demoVideo && (
        <div className="mb-6">
          <div className="relative w-full rounded-xl border border-surface-800/50 overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={demoVideo.embedUrl}
              title={`${tool.name} demo video`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}

      {tool.screenshot_urls && tool.screenshot_urls.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {tool.screenshot_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${tool.name} screenshot ${i + 1}`}
                className="h-48 rounded-xl border border-surface-800/50 object-cover flex-shrink-0"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-3">About</h2>
          <p className="text-surface-300 leading-relaxed whitespace-pre-line">{tool.description}</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-300 mb-3">Details</h3>
            <div className="space-y-3">
              {tool.category && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category</span>
                  <Link to={`/tools?category=${tool.category.slug}`} className="text-brand-400 hover:text-brand-300 transition-colors">
                    {tool.category.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Pricing</span>
                <span className={`capitalize ${pricingColor[tool.pricing] || 'text-surface-300'}`}>{tool.pricing}</span>
              </div>
              {tool.pricing_details && (
                <p className="text-xs text-surface-500 pt-1">{tool.pricing_details}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Level</span>
                <span className="capitalize text-surface-300">{tool.difficulty_level}</span>
              </div>
            </div>
          </div>

          {tool.tags.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-300 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span key={tag} className="badge-neutral">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {tutorials.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Tutorials</h2>
          </div>
          <div className="space-y-3">
            {tutorials.map((tut) => (
              <Link key={tut.id} to={`/tutorials/${tut.slug}`} className="block p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors">
                <h4 className="text-sm font-medium text-surface-200">{tut.title}</h4>
                <p className="text-xs text-surface-500 mt-1">{tut.content_type} -- {tut.duration_minutes} min</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {experts.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Experts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {experts.map((exp) => (
              <Link key={exp.id} to={`/experts/${exp.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-surface-700 overflow-hidden flex-shrink-0">
                  {exp.avatar_url ? (
                    <img src={exp.avatar_url} alt={exp.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-surface-400">{exp.name.charAt(0)}</div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-surface-200">{exp.name}</h4>
                  <p className="text-xs text-surface-500">{exp.country}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Projects using {tool.name}</h2>
          </div>
          <div className="space-y-3">
            {projects.map((proj) => (
              <Link key={proj.id} to={`/projects/${proj.slug}`} className="block p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors">
                <h4 className="text-sm font-medium text-surface-200">{proj.title}</h4>
                <p className="text-xs text-surface-500 mt-1 line-clamp-1">{proj.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-1">{tool.name} alternatives</h2>
          <p className="text-sm text-surface-400 mb-4">
            Other {tool.category?.name ?? 'AI &amp; no-code'} tools people compare with {tool.name}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.map((alt) => (
              <Link key={alt.id} to={`/tools/${alt.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-700 border border-surface-600/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {alt.logo_url ? (
                    <img src={alt.logo_url} alt={alt.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-sm font-bold text-surface-400">{alt.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-surface-200">{alt.name}</h4>
                  <p className="text-xs text-surface-500 line-clamp-1">{alt.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
