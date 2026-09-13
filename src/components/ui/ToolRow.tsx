import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { Tool } from '../../types';

interface ToolRowProps {
  tool: Tool;
  /** Fecha de alta a la derecha. Solo tiene sentido en listas ordenadas por fecha. */
  showDate?: boolean;
}

/**
 * La misma herramienta, en fila en vez de en tarjeta.
 *
 * Existe por un motivo concreto: la home apilaba cuatro rejillas de tres
 * columnas de `ToolCard` idénticas, una detrás de otra. Cambiar el color del
 * icono de la cabecera no arregla eso — a treinta centímetros de la pantalla
 * los cuatro bloques son el mismo bloque repetido.
 *
 * Una lista es una forma distinta, no una variante: densa, escaneable de arriba
 * abajo, y con sitio para la categoría y la fecha que la tarjeta no enseña.
 */
export default memo(function ToolRow({ tool, showDate = false }: ToolRowProps) {
  const date = showDate
    ? new Date(tool.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group flex items-center gap-4 px-4 py-3 -mx-4 rounded-xl hover:bg-surface-900/70 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-surface-800 border border-surface-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {tool.logo_url ? (
          <img
            src={tool.logo_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="text-sm font-bold text-surface-400">{tool.name.charAt(0)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors truncate">
            {tool.name}
          </h3>
          {tool.is_verified && (
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" aria-label="Verified" />
          )}
        </div>
        <p className="text-xs text-surface-500 truncate mt-0.5">{tool.tagline}</p>
      </div>

      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        {tool.category?.name && (
          <span className="text-xs text-surface-500">{tool.category.name}</span>
        )}
        {date && <span className="text-xs text-surface-600 w-14 text-right tabular-nums">{date}</span>}
      </div>
    </Link>
  );
});
