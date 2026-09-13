import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, ShieldCheck, Rocket, Sparkles } from 'lucide-react';
import type { Tool } from '../../types';
import UpvoteButton from './UpvoteButton';

const pricingColors: Record<string, string> = {
  free: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  freemium: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  paid: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  enterprise: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

interface ToolCardProps {
  tool: Tool;
}

/**
 * Señales que la tarjeta NO muestra, a propósito:
 *
 *  - `rating` y `review_count`: sembrados por el scraper. 0 de 200 herramientas
 *    subidas por makers tiene rating, así que enseñarlo solo servía para que
 *    una herramienta real pareciese peor que las de muestra.
 *  - el contador de upvotes: 60 filas tienen valores de ejemplo (Canva 19.800)
 *    y las otras 3.015 están a cero. El botón sigue ahí porque el voto sí es
 *    una acción real; el número no lo era.
 *  - `is_trending`: 188 flags puestos a mano una vez y nunca recalculados. El
 *    icono de tendencia sale ahora de `trending_score`, que se calcula cada
 *    hora a partir de visitas y clics reales.
 */
export default memo(function ToolCard({ tool }: ToolCardProps) {
  const isTrending = tool.trending_score > 0;
  const screenshot = tool.screenshot_urls?.[0];

  const meta = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`badge border ${pricingColors[tool.pricing] || pricingColors.free}`}>
        {tool.pricing}
      </span>
      <UpvoteButton itemType="tools" itemId={tool.id} initialCount={tool.upvotes} size="sm" showCount={false} />
      {tool.tags.length > 0 && <span className="badge-neutral">{tool.tags[0]}</span>}
    </div>
  );

  // El plan Boost se vendía con un borde y una píldora de 10px, indistinguibles
  // en una rejilla de tres columnas. Si el producto no se ve, no se compra: la
  // herramienta impulsada ocupa ahora la fila entera, con otro formato y un
  // acento propio (violeta) que no compite con el verde de marca — que en el
  // resto del sitio significa "gratis" y "pagar".
  if (tool.is_boosted) {
    return (
      <Link
        to={`/tools/${tool.slug}`}
        className="glass-card-hover p-6 group block md:col-span-2 lg:col-span-3 border-violet-500/30 hover:border-violet-500/50"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover rounded-2xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <span className="text-2xl font-bold text-surface-400">{tool.name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 px-2 py-0.5 mb-2 rounded-full bg-violet-500/10 border border-violet-500/25 w-fit">
              <Rocket className="w-3 h-3 text-violet-300" />
              <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wide">Boosted</span>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                {tool.name}
              </h3>
              {isTrending && <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0" aria-label="Trending" />}
              {tool.is_verified && <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" aria-label="Verified" />}
              <ArrowUpRight className="w-4 h-4 text-surface-600 group-hover:text-violet-300 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </div>

            <p className="text-sm text-surface-300 leading-relaxed mb-4 max-w-2xl">{tool.tagline}</p>

            {meta}
          </div>

          {screenshot && (
            <img
              src={screenshot}
              alt=""
              width={256}
              height={144}
              className="hidden lg:block w-64 h-36 object-cover rounded-xl border border-surface-700/50 flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={`glass-card-hover p-5 group block ${tool.is_featured ? 'border-amber-500/20 hover:border-amber-500/35' : ''}`}
    >
      {tool.is_featured && (
        <div className="flex items-center gap-1.5 mb-3 -mt-0.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Editor's Pick</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {tool.logo_url ? (
            <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover rounded-xl" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <span className="text-lg font-bold text-surface-400">{tool.name.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
              {tool.name}
            </h3>
            {isTrending && <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label="Trending" />}
            {tool.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" aria-label="Verified" />}
            <ArrowUpRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
          </div>

          <p className="text-sm text-surface-400 line-clamp-2 leading-relaxed mb-3">{tool.tagline}</p>

          {meta}
        </div>
      </div>
    </Link>
  );
});
