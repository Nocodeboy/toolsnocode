import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, BookOpen, Video, FileText, GraduationCap,
  ExternalLink, Pencil, Star, ChevronUp, TrendingUp, Globe,
  Play, Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from '../components/ui/FavoriteButton';
import TutorialCard from '../components/ui/TutorialCard';
import type { Tutorial, Tool } from '../types';
import { useSEO } from '../hooks/useSEO';
import { parseVideoUrl } from '../lib/video';

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  guide: BookOpen,
  course: GraduationCap,
  article: FileText,
};

const levelColors: Record<string, string> = {
  beginner: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  intermediate: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  advanced: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const pricingColors: Record<string, string> = {
  free: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  freemium: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  paid: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  enterprise: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

export default function TutorialDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [tool, setTool] = useState<Tool | null>(null);
  const [relatedTutorials, setRelatedTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoActive, setVideoActive] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data } = await supabase
        .from('tutorials')
        .select('*, tool:tools(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setTutorial(data);
        const loadedTool: Tool | null = data.tool ?? null;
        if (loadedTool) {
          setTool(loadedTool);

          const { data: related } = await supabase
            .from('tutorials')
            .select('*, tool:tools(*)')
            .eq('tool_id', loadedTool.id)
            .neq('slug', slug)
            .order('created_at', { ascending: false })
            .limit(3);

          if (related) setRelatedTutorials(related);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!tutorial) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tutorials', item: 'https://toolsnocode.com/tutorials' },
          { '@type': 'ListItem', position: 2, name: tutorial.title },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': tutorial.content_type === 'video' ? 'VideoObject' : 'Article',
        name: tutorial.title,
        description: tutorial.description?.slice(0, 200),
        ...(tutorial.thumbnail_url ? { thumbnailUrl: tutorial.thumbnail_url } : {}),
        author: {
          '@type': 'Person',
          name: tutorial.author_name || 'ToolsNoCode',
        },
        datePublished: tutorial.created_at,
        ...(tutorial.video_url ? { contentUrl: tutorial.video_url } : {}),
      },
    ];
  }, [tutorial]);

  useSEO({
    title: tutorial ? tutorial.title : undefined,
    description: tutorial ? tutorial.description?.slice(0, 160) : undefined,
    image: tutorial?.thumbnail_url,
    url: tutorial ? `/tutorials/${tutorial.slug}` : undefined,
    type: 'article',
    jsonLd,
    // Un slug inexistente devuelve 200 con la shell del SPA: sin esto sería un soft-404.
    noindex: !loading && !tutorial,
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-5 bg-surface-800 rounded w-28" />
          <div className="aspect-video bg-surface-800 rounded-2xl" />
          <div className="h-8 bg-surface-800 rounded w-2/3" />
          <div className="h-4 bg-surface-800 rounded w-full" />
          <div className="h-4 bg-surface-800 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Tutorial not found</h1>
        <Link to="/tutorials" className="btn-primary">Back to Tutorials</Link>
      </div>
    );
  }

  const Icon = typeIcons[tutorial.content_type] || FileText;
  const videoInfo = tutorial.video_url ? parseVideoUrl(tutorial.video_url) : null;
  const hasVideo = !!videoInfo;
  const previewThumb =
    videoInfo?.thumbnailUrl ||
    tutorial.thumbnail_url ||
    null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link
        to="/tutorials"
        className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tutorials
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video / thumbnail section */}
          {(hasVideo || previewThumb) && (
            <div className="aspect-video bg-surface-950 rounded-2xl overflow-hidden border border-surface-800/50 shadow-xl shadow-black/30 relative">
              {videoActive && !embedFailed ? (
                <>
                  <iframe
                    src={`${videoInfo!.embedUrl}&autoplay=1`}
                    title={tutorial.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onError={() => setEmbedFailed(true)}
                  />
</>
              ) : (
                <>
                  {previewThumb ? (
                    <img
                      src={previewThumb}
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-900" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  {embedFailed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <p className="text-white/70 text-sm text-center max-w-xs">
                        This video cannot be played on external sites.
                      </p>
                      <a
                        href={tutorial.video_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200 shadow-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Watch on YouTube
                      </a>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setVideoActive(true)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 group"
                        aria-label="Play video"
                      >
                        <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/25 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-200 shadow-xl">
                          <Play className="w-8 h-8 text-white ml-1.5" fill="white" />
                        </div>
                        <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                          Click to play
                        </span>
                      </button>
                      {tutorial.video_url && (
                        <a
                          href={tutorial.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-black/50 hover:bg-black/70 px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open on YouTube
                        </a>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Header info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge border ${levelColors[tutorial.difficulty_level] || levelColors.beginner}`}>
                {tutorial.difficulty_level}
              </span>
              <span className="badge-neutral capitalize flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {tutorial.content_type}
              </span>
              {tutorial.duration_minutes > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-surface-500">
                  <Clock className="w-3 h-3" />
                  {tutorial.duration_minutes} min
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
              {tutorial.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {tutorial.author_name && (
                <p className="text-sm text-surface-400">
                  By <span className="text-surface-200 font-medium">{tutorial.author_name}</span>
                </p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {user?.id === tutorial.user_id && (
                  <Link to={`/tutorials/${tutorial.slug}/edit`} className="btn-secondary text-sm py-2 px-3">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                )}
                <FavoriteButton
                  isFavorite={isFavorite('tutorials', tutorial.id)}
                  onToggle={() => toggleFavorite('tutorials', tutorial.id)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              About this tutorial
            </h2>
            <p className="text-surface-300 leading-relaxed whitespace-pre-line">{tutorial.description}</p>
          </div>

          {/* External link for non-embeddable content */}
          {tutorial.video_url && !hasVideo && (
            <a
              href={tutorial.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Watch Tutorial
            </a>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related tool */}
          {tool && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">
                Tool covered
              </h3>
              <Link
                to={`/tools/${tool.slug}`}
                className="group block p-4 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 hover:border-surface-600/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-700 border border-surface-600/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {tool.logo_url ? (
                      <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-surface-400">{tool.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
                        {tool.name}
                      </h4>
                      {tool.is_trending && <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-1 mt-0.5">{tool.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge border ${pricingColors[tool.pricing] || pricingColors.free}`}>
                    {tool.pricing}
                  </span>
                  {tool.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-surface-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {tool.rating.toFixed(1)}
                    </span>
                  )}
                  {tool.upvotes > 0 && (
                    <span className="flex items-center gap-1 text-xs text-surface-500">
                      <ChevronUp className="w-3 h-3" />
                      {tool.upvotes}
                    </span>
                  )}
                </div>
              </Link>

              <div className="mt-3 flex flex-col gap-2">
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-2 w-full"
                  >
                    <Globe className="w-4 h-4" />
                    Visit website
                  </a>
                )}
                <Link to={`/tools/${tool.slug}`} className="btn-primary text-sm py-2 w-full">
                  <ExternalLink className="w-4 h-4" />
                  See full details
                </Link>
              </div>
            </div>
          )}

          {/* Quick info card */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Level</span>
                <span className={`badge border capitalize ${levelColors[tutorial.difficulty_level] || levelColors.beginner}`}>
                  {tutorial.difficulty_level}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Format</span>
                <span className="text-surface-300 capitalize flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  {tutorial.content_type}
                </span>
              </div>
              {tutorial.duration_minutes > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500">Duration</span>
                  <span className="text-surface-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {tutorial.duration_minutes} min
                  </span>
                </div>
              )}
              {tutorial.author_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500">Author</span>
                  <span className="text-surface-300">{tutorial.author_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More tutorials for this tool */}
      {relatedTutorials.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              More tutorials for{' '}
              <span className="text-brand-400">{tool?.name}</span>
            </h2>
            {tool && (
              <Link
                to={`/tutorials?tool=${tool.slug}`}
                className="text-sm text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedTutorials.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
