import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Tailwind color stem, e.g. 'amber' — the icon's tint. */
  tone?: 'brand' | 'amber' | 'violet' | 'sky';
  href?: string;
  linkLabel?: string;
}

// La home tenía cuatro cabeceras de sección con cuatro estilos: caja de icono de
// 10, caja de 8, sin caja, y títulos de 3xl junto a títulos de 2xl. Ninguna de
// esas diferencias significaba nada — eran cuatro momentos distintos de escribir
// el mismo bloque. Una sola forma, y el color como única variable.
const tones = {
  brand: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
};

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  tone = 'brand',
  href,
  linkLabel = 'View all',
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
            <Icon className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {href && (
        <Link
          to={href}
          className="text-sm text-surface-400 hover:text-white flex items-center gap-1 transition-colors flex-shrink-0 group"
        >
          {linkLabel}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
