import { Link } from 'react-router-dom';
import { entity } from '../../../site.config';
import type { Listing } from '../../types';

export default function ListingCard({ listing }: { listing: Pick<Listing, 'name' | 'slug' | 'tagline' | 'logo_url' | 'is_boosted'> }) {
  return (
    <Link
      to={`/${entity.path}/${listing.slug}`}
      className="glass-card p-4 flex items-start gap-3 hover:border-surface-600/80 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700/50 overflow-hidden flex items-center justify-center shrink-0">
        {listing.logo_url
          ? <img src={listing.logo_url} alt="" className="w-full h-full object-cover" loading="lazy"
                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <span className="text-sm font-bold text-surface-400">{listing.name.charAt(0)}</span>}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-surface-100 truncate">
          {listing.name}
          {listing.is_boosted && <span className="ml-2 badge badge-green">Featured</span>}
        </h3>
        {listing.tagline && <p className="text-sm text-surface-400 line-clamp-2">{listing.tagline}</p>}
      </div>
    </Link>
  );
}
