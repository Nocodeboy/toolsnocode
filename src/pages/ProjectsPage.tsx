import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Tool } from '../types';
import ProjectCard from '../components/ui/ProjectCard';
import SearchBar from '../components/ui/SearchBar';
import { useSEO } from '../hooks/useSEO';

const PAGE_SIZE = 24;

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<(Project & { tools: Tool[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const pageRef = useRef(0);
  const { user } = useAuth();

  useSEO({
    title: 'No-Code Projects Showcase',
    description: 'Explore real projects built with no-code and AI tools. Get inspired, discover tech stacks, and showcase your own creations.',
    url: '/projects',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'No-Code Projects Showcase',
      url: 'https://toolsnocode.com/projects',
      description: 'Explore real projects built with no-code and AI tools. Get inspired, discover tech stacks, and showcase your own creations.',
    },
  });

  const search = searchParams.get('q') || '';

  const buildQuery = useCallback((from: number, to: number) => {
    let query = supabase
      .from('projects')
      .select('*, project_tools(tool:tools(*))', { count: 'exact' })
      // Los upvotes de projects son del seed del 2026-03-08 (631, 524, 489...),
      // así que ordenar por ellos congela la lista en los datos de muestra.
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author_name.ilike.%${search}%`);
    }

    return query.range(from, to);
  }, [search]);

  function mapProjects(data: Record<string, unknown>[]) {
    return data.map((p) => ({
      ...p,
      tools: (p.project_tools as { tool: Tool }[] | undefined)?.map((pt) => pt.tool).filter(Boolean) || [],
    })) as (Project & { tools: Tool[] })[];
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      pageRef.current = 0;
      const { data, count } = await buildQuery(0, PAGE_SIZE - 1);
      setProjects(data ? mapProjects(data) : []);
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
      setProjects((prev) => [...prev, ...mapProjects(data)]);
      pageRef.current = nextPage;
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    setSearchParams(params);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Showcase</h1>
          <p className="text-surface-400">
            Explore amazing projects built with AI and no-code tools.
          </p>
        </div>
        {user && (
          <Link to="/projects/new" className="btn-primary text-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add Project
          </Link>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={updateSearch}
        placeholder="Search projects..."
        className="max-w-xl mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-surface-800" />
              <div className="p-5">
                <div className="h-4 bg-surface-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-400 text-lg mb-2">No projects found</p>
          <p className="text-surface-500 text-sm mb-6">Try adjusting your search.</p>
          {user && (
            <Link to="/projects/new" className="btn-primary text-sm inline-flex">
              <Plus className="w-4 h-4" />
              Add the first project
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-surface-500 mb-4">
            {total !== null ? (
              <>Showing {projects.length} of {total} project{total !== 1 ? 's' : ''}</>
            ) : (
              <>{projects.length} project{projects.length !== 1 ? 's' : ''} found</>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
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

          {!hasMore && projects.length > PAGE_SIZE && (
            <p className="text-center text-sm text-surface-600 mt-10">
              All {projects.length} projects loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
