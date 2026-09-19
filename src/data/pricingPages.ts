/**
 * Páginas `/categories/:slug/:pricing`.
 *
 * "Free AI video tools" es una búsqueda con intención de compra que la página
 * de categoría no responde: mezcla los cuatro modelos. Estas variantes existen
 * porque el campo `pricing` se ha contrastado con la web de cada herramienta
 * (439 correcciones el 17-18 de septiembre); antes de eso una lista de
 * "herramientas gratis" habría sido, en parte, una lista de demos.
 *
 * El texto es una plantilla a propósito: lo que distingue a cada página es la
 * lista, no el párrafo. Por eso solo se indexan las variantes con al menos
 * `INDEX_MIN` herramientas; por debajo la página funciona pero va en noindex.
 */

export const PRICING_SLUGS = ['free', 'freemium', 'paid', 'enterprise'] as const;
export type PricingSlug = (typeof PRICING_SLUGS)[number];

export const INDEX_MIN = 8;

export const isPricingSlug = (s: string | undefined | null): s is PricingSlug =>
  !!s && (PRICING_SLUGS as readonly string[]).includes(s);

export const PRICING_LABEL: Record<PricingSlug, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  enterprise: 'Enterprise',
};

const DEFINITION: Record<PricingSlug, string> = {
  free: 'free to use according to the tool\'s own site, with no paid plan mentioned anywhere on it',
  freemium: 'offering a permanent free plan next to paid ones; a free trial alone does not count',
  paid: 'requiring payment, including tools that start with a free trial or a few free credits and then bill',
  enterprise: 'sold without a public price: the only way in is a demo, a sales call or an access request',
};

export interface PricingCopy {
  heading: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
}

export function pricingCopy(pricing: PricingSlug, categoryName: string, count: number | null): PricingCopy {
  const label = PRICING_LABEL[pricing];
  const n = count === null ? '' : `${count} `;
  const heading = pricing === 'enterprise'
    ? `Enterprise ${categoryName} Tools (Demo-Only Pricing)`
    : `${label} ${categoryName} Tools`;
  const metaTitle = count === null ? `${label} ${categoryName} Tools` : `${label} ${categoryName} Tools (${count})`;
  const metaDescription = pricing === 'enterprise'
    ? `${n}${categoryName.toLowerCase()} tools sold through a demo or sales call, with no public price. Each label is checked against the tool's own site, not guessed.`
    : `${n}${categoryName.toLowerCase()} tools that are ${pricing} today, with the label checked against each tool's own site rather than guessed from a scraper.`;
  const intro = [
    `Every tool on this page is listed as ${pricing} because its own website says so: ${DEFINITION[pricing]}. The directory used to default to "freemium" whenever a page did not say; those labels were re-read from the source in September 2026, so a filter on ${pricing} now means what it says.`,
    `Use it to shortlist ${categoryName.toLowerCase()} tools that fit how you want to pay, then open a listing for the description, screenshots and a direct link. If a label looks wrong, the tool's maker can claim the listing and fix it.`,
  ].join('\n\n');
  return { heading, metaTitle, metaDescription, intro };
}
