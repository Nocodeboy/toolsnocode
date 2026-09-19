import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { entity, facets, site } from '../../site.config';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import ListingCard from '../components/ui/ListingCard';
import type { Listing } from '../types';

export default function DetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [siblings, setSiblings] = useState<Listing[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase.from('listings').select('*, category:categories(*)').eq('slug', slug).maybeSingle()
      .then(({ data, error }) => {
        // Un 404 real es consulta correcta y cero filas; un error deja `data`
        // en null igual, y marcar eso como "no existe" sería mentir.
        if (!data && !error) setNotFound(true);
        setListing(data as Listing | null);
        setLoading(false);
        if (data?.category_id) {
          supabase.from('listings').select('*').eq('category_id', data.category_id).neq('slug', slug)
            .order('trending_score', { ascending: false }).limit(6)
            .then(({ data: sib }) => setSiblings((sib ?? []) as Listing[]));
        }
        if (data?.id) {
          // Registro de la visita. Lo cuenta la función, que filtra rastreadores.
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ listing_id: data.id, event_type: 'detail_view' }),
          }).catch(() => { /* la analítica nunca rompe la página */ });
        }
      });
  }, [slug]);

  const jsonLd = useMemo(() => (listing ? {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: listing.name,
    description: listing.description || listing.tagline,
    url: listing.website || `${site.url}/${entity.path}/${listing.slug}`,
  } : undefined), [listing]);

  useSEO({
    title: listing ? `${listing.name} — ${listing.tagline}` : undefined,
    description: listing?.description?.slice(0, 160),
    url: listing ? `/${entity.path}/${listing.slug}` : undefined,
    // Un slug inexistente devuelve 200 con la cáscara del SPA: sin esto sería
    // un soft 404, y el sitio pasa a tener infinitas páginas para el buscador.
    noindex: notFound,
    jsonLd,
  });

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-surface-500">Loading…</div>;

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Not found</h1>
        <Link to={`/${entity.path}`} className="btn-primary">Back to the directory</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">{listing.name}</h1>
      {listing.tagline && <p className="text-surface-300 mb-6">{listing.tagline}</p>}

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {listing.website && (
          <a
            href={listing.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="btn-primary text-sm"
            onClick={() => {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
                body: JSON.stringify({ listing_id: listing.id, event_type: 'outbound_click' }),
              }).catch(() => {});
            }}
          >
            {entity.outboundLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {listing.category && (
          <Link to={`/categories/${listing.category.slug}`} className="btn-secondary text-sm">{listing.category.name}</Link>
        )}
        {listing.facet && listing.category && (
          <Link to={`/categories/${listing.category.slug}/${listing.facet}`} className="badge badge-neutral">
            {facets.labels[listing.facet] ?? listing.facet}
          </Link>
        )}
      </div>

      {listing.description && (
        <div className="glass-card p-6 mb-10">
          <p className="text-surface-300 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>
      )}

      {siblings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Alternatives to {listing.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {siblings.map((s) => <ListingCard key={s.id} listing={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}
