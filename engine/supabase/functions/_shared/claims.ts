import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.1';

/**
 * Lo que comparten `claim-notify` (avisa de que entra una reclamación) y
 * `claims-review` (la resuelve).
 *
 * A diferencia del proyecto original, aquí una reclamación apunta siempre a
 * una ficha: `claim_requests.listing_id`. Allí la tabla era polimórfica
 * (`item_type` + `item_id` para herramientas, expertos, tutoriales y
 * proyectos) y eso obligaba a un mapa de tablas y de columnas de título en
 * cada consulta, para un caso que casi nunca se usaba.
 */

export interface ClaimedListing {
  title: string | null;
  slug: string | null;
  owner_id: string | null;
  website: string | null;
}

export async function describeListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ClaimedListing | null> {
  const { data } = await supabase
    .from('listings')
    .select('name, slug, user_id, website')
    .eq('id', listingId)
    .maybeSingle();
  if (!data) return null;
  return { title: data.name, slug: data.slug, owner_id: data.user_id, website: data.website };
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
 * ficha. No basta para aprobar a ciegas —un correo de Gmail no significa
 * impostura, y un dominio propio no acredita el cargo— pero es lo primero que
 * hay que mirar y conviene tenerlo delante al decidir.
 */
export function emailMatchesSite(email: string | null, website: string | null): boolean | null {
  const e = domainOf(email), w = domainOf(website);
  if (!e || !w) return null;
  return e === w || w.endsWith(`.${e}`) || e.endsWith(`.${w}`);
}
