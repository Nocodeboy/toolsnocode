import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { Project } from '../../types';
import UpvoteButton from './UpvoteButton';

interface ProjectCardProps {
  project: Project;
}

export default memo(function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.slug}`} className="glass-card-hover overflow-hidden group block">
      <div className="aspect-[16/10] bg-surface-800 relative overflow-hidden">
        {project.screenshot_url ? (
          <img
            src={project.screenshot_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
            <span className="text-3xl font-bold text-surface-700">
              {project.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {project.live_url && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors mb-1">
          {project.title}
        </h3>

        <p className="text-sm text-surface-400 line-clamp-2 mb-3">
          {project.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-surface-500">{project.author_name}</span>
          <UpvoteButton itemType="projects" itemId={project.id} initialCount={project.upvotes} size="sm" showCount={false} />
        </div>

        {project.tools && project.tools.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-surface-800/50">
            {project.tools.slice(0, 4).map((tool) => (
              <div
                key={tool.id}
                className="w-6 h-6 rounded-md bg-surface-800 border border-surface-700/50 overflow-hidden flex items-center justify-center"
                title={tool.name}
              >
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span className="text-[10px] font-bold text-surface-500">
                    {tool.name.charAt(0)}
                  </span>
                )}
              </div>
            ))}
            {project.tools.length > 4 && (
              <span className="text-[10px] text-surface-500 ml-1">
                +{project.tools.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});
