import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Globe, ExternalLink, DollarSign, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from '../components/ui/FavoriteButton';
import ClaimButton from '../components/ui/ClaimButton';
import type { Expert, Tool } from '../types';
import { useSEO } from '../hooks/useSEO';

export default function ExpertDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [tools, setTools] = useState<(Tool & { _proficiency?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const handleClaimed = () => {
    setExpert((prev) => prev ? { ...prev, user_id: user?.id } : prev);
  };

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data: expertData } = await supabase
        .from('experts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!expertData) {
        setLoading(false);
        return;
      }

      setExpert(expertData);

      const { data: toolsData } = await supabase
        .from('expert_tools')
        .select('tool:tools(*), proficiency_level')
        .eq('expert_id', expertData.id);

      if (toolsData) {
        setTools(toolsData.map((row) => ({ ...(row.tool as unknown as Tool), _proficiency: row.proficiency_level as string })).filter((t) => t.id));
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!expert) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Experts', item: 'https://toolsnocode.com/experts' },
          { '@type': 'ListItem', position: 2, name: expert.name },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: expert.name,
        description: expert.bio?.slice(0, 200),
        image: expert.avatar_url,
        url: expert.portfolio_url || `https://toolsnocode.com/experts/${expert.slug}`,
        knowsAbout: tools.map((t) => t.name),
        ...(expert.country ? { addressCountry: expert.country } : {}),
      },
    ];
  }, [expert, tools]);

  useSEO({
    title: expert ? `${expert.name} - No-Code Expert` : undefined,
    description: expert ? expert.bio?.slice(0, 160) : undefined,
    image: expert?.avatar_url,
    url: expert ? `/experts/${expert.slug}` : undefined,
    type: 'profile',
    jsonLd,
    // Sin contenido propio que indexar: la mediana de una bio de experto son 10
    // palabras y 999 de cada 1.000 tutoriales tienen la descripción vacía. Las
    // páginas siguen siendo navegables; simplemente no van al índice hasta que
    // tengan algo que decir. Se revierte quitando esta línea.
    noindex: true,
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-surface-800 rounded w-24" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-surface-800 rounded-full" />
            <div>
              <div className="h-7 bg-surface-800 rounded w-40 mb-2" />
              <div className="h-4 bg-surface-800 rounded w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Expert not found</h1>
        <Link to="/experts" className="btn-primary">Back to Experts</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/experts" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Experts
      </Link>

      <div className="glass-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-surface-800 border-2 border-surface-700/50 overflow-hidden flex-shrink-0">
            {expert.avatar_url ? (
              <img src={expert.avatar_url} alt={expert.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-surface-400">{expert.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{expert.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {expert.country && (
                <span className="flex items-center gap-1.5 text-sm text-surface-400">
                  <MapPin className="w-4 h-4" />
                  {expert.country}
                </span>
              )}
              {expert.rating > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-surface-300">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {expert.rating.toFixed(1)}
                  <span className="text-surface-500">({expert.review_count} reviews)</span>
                </span>
              )}
              {expert.hourly_rate > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-brand-400 font-medium">
                  <DollarSign className="w-4 h-4" />
                  ${expert.hourly_rate}/hr
                </span>
              )}
              {expert.languages.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-surface-400">
                  <Globe className="w-4 h-4" />
                  {expert.languages.join(', ')}
                </span>
              )}
            </div>

            <p className="text-surface-300 leading-relaxed mb-5">{expert.bio}</p>

            <div className="flex flex-wrap items-center gap-3">
              {expert.portfolio_url && (
                <a href={expert.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                  View Portfolio
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {!expert.user_id && (
                <ClaimButton itemType="experts" itemId={expert.id} itemName={expert.name} onClaimed={handleClaimed} />
              )}
              {user?.id === expert.user_id && (
                <Link to={`/experts/${expert.slug}/edit`} className="btn-secondary text-sm">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
              )}
              <FavoriteButton
                isFavorite={isFavorite('experts', expert.id)}
                onToggle={() => toggleFavorite('experts', expert.id)}
              />
            </div>
          </div>
        </div>
      </div>

      {tools.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tools & Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <Link key={tool.id} to={`/tools/${tool.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-700 border border-surface-600/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-sm font-bold text-surface-400">{tool.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-surface-200">{tool.name}</h4>
                  {tool._proficiency && (
                    <span className="text-xs text-surface-500 capitalize">{tool._proficiency}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
