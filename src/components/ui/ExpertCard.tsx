import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, ArrowUpRight } from 'lucide-react';
import type { Expert } from '../../types';

interface ExpertCardProps {
  expert: Expert;
}

export default memo(function ExpertCard({ expert }: ExpertCardProps) {
  return (
    <Link to={`/experts/${expert.slug}`} className="glass-card-hover p-6 group block">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-800 border-2 border-surface-700/50 overflow-hidden flex-shrink-0">
          {expert.avatar_url ? (
            <img src={expert.avatar_url} alt={expert.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl font-bold text-surface-400">
                {expert.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
              {expert.name}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
          </div>

          <p className="text-sm text-surface-400 line-clamp-2 leading-relaxed mb-3">
            {expert.bio}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {expert.country && (
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <MapPin className="w-3 h-3" />
                {expert.country}
              </span>
            )}

            {expert.hourly_rate > 0 && (
              <span className="text-xs text-brand-400 font-medium">
                ${expert.hourly_rate}/hr
              </span>
            )}

            {expert.languages.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <Globe className="w-3 h-3" />
                {expert.languages.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
