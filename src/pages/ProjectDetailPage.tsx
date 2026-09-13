import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from '../components/ui/FavoriteButton';
import UpvoteButton from '../components/ui/UpvoteButton';
import type { Project, Tool } from '../types';
import { useSEO } from '../hooks/useSEO';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [project, setProject] = useState<Project | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setProject(data);

        const { data: toolsData } = await supabase
          .from('project_tools')
          .select('tool:tools(*)')
          .eq('project_id', data.id);

        if (toolsData) {
          setTools(toolsData.map((row) => row.tool as unknown as Tool).filter(Boolean));
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!project) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Projects', item: 'https://toolsnocode.com/projects' },
          { '@type': 'ListItem', position: 2, name: project.title },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.title,
        description: project.description?.slice(0, 200),
        image: project.screenshot_url,
        url: project.live_url || `https://toolsnocode.com/projects/${project.slug}`,
        author: {
          '@type': 'Person',
          name: project.author_name,
        },
        datePublished: project.created_at,
      },
    ];
  }, [project]);

  useSEO({
    title: project ? `${project.title} - No-Code Project` : undefined,
    description: project ? project.description?.slice(0, 160) : undefined,
    image: project?.screenshot_url,
    url: project ? `/projects/${project.slug}` : undefined,
    type: 'article',
    jsonLd,
    // Un slug inexistente devuelve 200 con la shell del SPA: sin esto sería un soft-404.
    noindex: !loading && !project,
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-surface-800 rounded w-24" />
          <div className="aspect-video bg-surface-800 rounded-2xl" />
          <div className="h-7 bg-surface-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Project not found</h1>
        <Link to="/projects" className="btn-primary">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {project.screenshot_url && (
        <div className="aspect-video bg-surface-900 rounded-2xl overflow-hidden mb-6 border border-surface-800/50">
          <img
            src={project.screenshot_url}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{project.title}</h1>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-sm text-surface-400">
            By <span className="text-surface-200">{project.author_name}</span>
          </span>
          <UpvoteButton itemType="projects" itemId={project.id} initialCount={project.upvotes} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
              View Live Demo
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {user?.id === project.user_id && (
            <Link to={`/projects/${project.slug}/edit`} className="btn-secondary text-sm">
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
          <FavoriteButton
            isFavorite={isFavorite('projects', project.id)}
            onToggle={() => toggleFavorite('projects', project.id)}
          />
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <p className="text-surface-300 leading-relaxed whitespace-pre-line">{project.description}</p>
      </div>

      {tools.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tech Stack</h2>
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
                  <p className="text-xs text-surface-500 line-clamp-1">{tool.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
