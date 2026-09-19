import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.1';

/**
 * Lo que comparten las dos piezas de reclamaciones: `claim-notify`, que avisa
 * cuando entra una, y `claims-review`, que la resuelve. Las dos necesitan
 * describir la ficha reclamada y mirar si el correo del reclamante sale del
 * dominio de la herramienta.
 */

const ITEM_TABLES: Record<string, string> = {
  tools: 'tools',
  experts: 'experts',
  tutorials: 'tutorials',
  projects: 'projects',
};

/** El nombre de cada tipo de ficha vive en una columna distinta. */
const TITLE_COLUMN: Record<string, string> = {
  tools: 'name',
  experts: 'name',
  tutorials: 'title',
  projects: 'title',
};

export interface ClaimedItem {
  table: string;
  title: string | null;
  slug: string | null;
  owner_id: string | null;
  website: string | null;
}

export async function describeItem(
  supabase: SupabaseClient,
  itemType: string,
  itemId: string,
): Promise<ClaimedItem | null> {
  const table = ITEM_TABLES[itemType];
  if (!table) return null;
  const title = TITLE_COLUMN[itemType];
  const cols = `id, slug, user_id, ${title}` + (itemType === 'tools' ? ', website' : '');
  const { data } = await supabase.from(table).select(cols).eq('id', itemId).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    table,
    title: row[title] as string | null,
    slug: row.slug as string | null,
    owner_id: row.user_id as string | null,
    website: (row.website as string | null) ?? null,
  };
}

/** El dominio de un correo y el de una web, sin `www.` ni subdominios de cortesía. */
export function domainOf(value: string | null): string | null {
  if (!value) return null;
  const raw = value.includes('@') ? value.split('@').pop()! : value.replace(/^https?:\/\//, '').split('/')[0];
  const host = raw.toLowerCase().replace(/^www\./, '').trim();
  return host || null;
}

/**
 * La prueba que se sostiene sola: el reclamante escribe desde el dominio de la
 * herramienta. No es suficiente para aprobar a ciegas (un correo de Gmail no
 * significa impostura, y un dominio propio no significa que sea quien dice),
 * pero es lo primero que hay que mirar.
 */
export function emailMatchesSite(email: string | null, website: string | null): boolean | null {
  const e = domainOf(email), w = domainOf(website);
  if (!e || !w) return null;
  return e === w || w.endsWith(`.${e}`) || e.endsWith(`.${w}`);
}

/** La URL pública de la ficha, para poder abrirla desde el correo. */
export function itemUrl(itemType: string, slug: string | null): string | null {
  return slug ? `https://toolsnocode.com/${itemType}/${slug}` : null;
}
