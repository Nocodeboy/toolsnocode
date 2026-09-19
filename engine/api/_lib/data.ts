/**
 * Lectura pública de Supabase desde el edge.
 *
 * Solo lo que la RLS deja ver a `anon`: es la misma clave que viaja en el
 * bundle del navegador, así que aquí no hay nada que un visitante no pudiera
 * pedir por su cuenta. Cada función devuelve `null` si no hay fila y lanza si
 * la red falla — quien llama decide qué hacer con cada caso: un 404 real en el
 * primero, el HTML sin tocar en el segundo.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function rest<T>(path: string): Promise<T[]> {
  if (!SUPABASE_URL || !ANON_KEY) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in the edge runtime');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}`);
  return (await res.json()) as T[];
}

const one = async <T>(path: string) => (await rest<T>(path))[0] ?? null;

/** Recuento exacto sin traer filas: PostgREST lo devuelve en `content-range`. */
export async function count(path: string): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'HEAD',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Prefer: 'count=exact' },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}`);
  const total = res.headers.get('content-range')?.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

export interface ListingRow {
  name: string; slug: string; tagline: string | null; description: string | null;
  logo_url: string | null; image_urls: string[] | null; facet: string | null;
  website: string | null; is_boosted: boolean | null; updated_at: string | null;
  category: { id: string; name: string; slug: string } | null;
}

export interface ListingCard { name: string; slug: string; tagline: string | null }

export interface CategoryRow { id: string; name: string; slug: string; description: string | null }

export interface PostRow {
  title: string; slug: string; summary: string; content: string | null;
  image_url: string | null; published_at: string; tags: string[] | null;
}

const LISTING_COLS = 'name,slug,tagline,description,logo_url,image_urls,facet,website,is_boosted,updated_at,category:categories(id,name,slug)';
const CARD_COLS = 'name,slug,tagline';

export const getListing = (slug: string) =>
  one<ListingRow>(`listings?slug=eq.${encodeURIComponent(slug)}&select=${LISTING_COLS}&limit=1`);

export const getCategory = (slug: string) =>
  one<CategoryRow>(`categories?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,description&limit=1`);

export const getPost = (slug: string) =>
  one<PostRow>(`posts?slug=eq.${encodeURIComponent(slug)}&select=title,slug,summary,content,image_url,published_at,tags&limit=1`);

export const getPostList = (limit = 20) =>
  rest<PostRow>(`posts?select=title,slug,summary,image_url,published_at&order=published_at.desc&limit=${limit}`);

export const getCategoriesWithCounts = () =>
  rest<{ name: string; slug: string; listing_count: number }>(
    'category_listing_counts?select=name,slug,listing_count&order=listing_count.desc',
  );

export const getFacetCounts = (categoryId: string) =>
  rest<{ facet: string; listing_count: number }>(
    `category_facet_counts?category_id=eq.${categoryId}&select=facet,listing_count`,
  );

export const getCategoryListingCount = (categoryId: string, facet?: string) =>
  count(`listings?category_id=eq.${categoryId}&delisted_at=is.null${facet ? `&facet=eq.${facet}` : ''}&select=id`);

export const getCategoryTop = (categoryId: string, limit = 12, facet?: string) =>
  rest<ListingCard>(
    `listings?category_id=eq.${categoryId}&delisted_at=is.null${facet ? `&facet=eq.${facet}` : ''}` +
    `&select=${CARD_COLS}&order=is_boosted.desc,trending_score.desc,name.asc&limit=${limit}`,
  );

/**
 * Las "alternativas" de una ficha: sus hermanas de categoría.
 *
 * Es el enlazado interno que convierte miles de hojas sueltas en una malla.
 * Sin esto, un rastreador que entra en una ficha desde fuera no tiene por
 * dónde seguir, y la ficha se queda sin fuerza propia.
 */
export const getSiblings = (categoryId: string, excludeSlug: string, limit = 6) =>
  rest<ListingCard>(
    `listings?category_id=eq.${categoryId}&delisted_at=is.null&slug=neq.${encodeURIComponent(excludeSlug)}` +
    `&select=${CARD_COLS}&order=trending_score.desc,name.asc&limit=${limit}`,
  );

export async function getHomeData() {
  const [total, categories, recent, boosted] = await Promise.all([
    count('listings?delisted_at=is.null&select=id'),
    getCategoriesWithCounts(),
    rest<ListingCard>(`listings?delisted_at=is.null&select=${CARD_COLS}&order=created_at.desc&limit=8`),
    rest<ListingCard>(`listings?delisted_at=is.null&is_boosted=eq.true&select=${CARD_COLS}&limit=4`),
  ]);
  return { total, categories, recent, boosted };
}

export async function getIndexData() {
  const [total, categories, top] = await Promise.all([
    count('listings?delisted_at=is.null&select=id'),
    getCategoriesWithCounts(),
    rest<ListingCard>(`listings?delisted_at=is.null&select=${CARD_COLS}&order=trending_score.desc,name.asc&limit=24`),
  ]);
  return { total, categories, top };
}
