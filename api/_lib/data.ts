/**
 * Lectura pública de Supabase desde el edge de Vercel.
 *
 * Solo lo que la RLS deja ver a `anon`: es la misma clave que viaja en el
 * bundle del navegador. Cada función devuelve `null` si no hay fila, y lanza
 * si la red falla — quien llama decide qué hacer con cada caso (un 404 real
 * en el primero, el HTML sin tocar en el segundo).
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://exlupbihqexeeyxwmveh.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function rest<T>(path: string): Promise<T[]> {
  if (!ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is not set for the edge runtime');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}`);
  return (await res.json()) as T[];
}

const one = async <T>(path: string) => (await rest<T>(path))[0] ?? null;

/** Recuento exacto sin traer filas: PostgREST lo devuelve en `content-range`. */
async function count(path: string): Promise<number> {
  if (!ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is not set for the edge runtime');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'HEAD',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Prefer: 'count=exact' },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}`);
  const total = res.headers.get('content-range')?.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

export interface ToolRow {
  name: string; slug: string; tagline: string | null; description: string | null;
  logo_url: string | null; screenshot_urls: string[] | null; pricing: string | null;
  website: string | null; is_boosted: boolean | null; updated_at: string | null;
  category: { id: string; name: string; slug: string } | null;
}
export interface NewsRow {
  title: string; slug: string; summary: string; content: string | null;
  image_url: string | null; published_at: string; source: string; tags: string[] | null;
}
export interface CategoryRow { name: string; slug: string; description: string | null; id: string }

export const getTool = (slug: string) =>
  one<ToolRow>(`tools?select=name,slug,tagline,description,logo_url,screenshot_urls,pricing,website,is_boosted,updated_at,category:categories(id,name,slug)&slug=eq.${encodeURIComponent(slug)}&limit=1`);

export const getNewsList = (n = 20) =>
  rest<NewsRow>(`news?select=title,slug,summary,content,image_url,published_at,source,tags&order=published_at.desc&limit=${n}`);

export const getNews = (slug: string) =>
  one<NewsRow>(`news?select=title,slug,summary,content,image_url,published_at,source,tags&slug=eq.${encodeURIComponent(slug)}&limit=1`);

export const getCategory = (slug: string) =>
  one<CategoryRow>(`categories?select=id,name,slug,description&slug=eq.${encodeURIComponent(slug)}&limit=1`);

export const getCategoryToolCount = async (categoryId: string, pricing?: string) =>
  pricing
    ? (await one<{ tool_count: number }>(`category_pricing_counts?select=tool_count&category_id=eq.${categoryId}&pricing=eq.${pricing}&limit=1`))?.tool_count ?? 0
    : (await one<{ tool_count: number }>(`category_tool_counts?select=tool_count&category_id=eq.${categoryId}&limit=1`))?.tool_count ?? 0;

export const getCategoryPricingCounts = async (categoryId: string) => {
  const rows = await rest<{ pricing: string; tool_count: number }>(`category_pricing_counts?select=pricing,tool_count&category_id=eq.${categoryId}`);
  return Object.fromEntries(rows.map((r) => [r.pricing, r.tool_count])) as Record<string, number>;
};

export const getCategoryTopTools = (categoryId: string, n = 12, pricing?: string) =>
  rest<{ name: string; slug: string; tagline: string | null }>(
    `tools?select=name,slug,tagline&category_id=eq.${categoryId}${pricing ? `&pricing=eq.${pricing}` : ''}&order=trending_score.desc,created_at.desc&limit=${n}`);

export const getCategoriesWithCounts = async () => {
  const [cats, counts] = await Promise.all([
    rest<CategoryRow>('categories?select=id,name,slug,description&parent_id=is.null'),
    rest<{ category_id: string; tool_count: number }>('category_tool_counts?select=category_id,tool_count'),
  ]);
  const byId = new Map(counts.map((c) => [c.category_id, c.tool_count]));
  return cats.map((c) => ({ ...c, tool_count: byId.get(c.id) ?? 0 })).sort((a, b) => b.tool_count - a.tool_count);
};

export interface ToolCard { name: string; slug: string; tagline: string | null; pricing: string | null }
const CARD = 'select=name,slug,tagline,pricing';

/** Lo que pinta `HomePage`: las mismas cuatro listas, en el mismo orden. */
export const getHomeData = async () => {
  const [boosted, picks, recent, trending, total, categories] = await Promise.all([
    rest<ToolCard>(`tools?${CARD}&is_boosted=eq.true&order=boost_expires_at.desc&limit=6`),
    rest<ToolCard>(`tools?${CARD}&is_featured=eq.true&is_boosted=eq.false&order=created_at.desc&limit=6`),
    rest<ToolCard>(`tools?${CARD}&order=created_at.desc&limit=8`),
    rest<ToolCard>(`tools?${CARD}&trending_score=gt.0&order=trending_score.desc&limit=6`),
    count('tools?select=slug'),
    getCategoriesWithCounts(),
  ]);
  return { boosted, picks, recent, trending, total, categories };
};

/** Lo que pinta `/tools` sin filtros: novedades primero, con las destacadas arriba. */
export const getToolsHubData = async () => {
  const [tools, total, categories] = await Promise.all([
    rest<ToolCard>(`tools?${CARD}&order=is_boosted.desc,created_at.desc&limit=24`),
    count('tools?select=slug'),
    getCategoriesWithCounts(),
  ]);
  return { tools, total, categories };
};
