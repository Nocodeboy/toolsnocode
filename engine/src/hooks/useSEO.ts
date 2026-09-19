import { useEffect } from 'react';
import { site } from '../../site.config';

/**
 * Título, descripción, canónica, tarjetas sociales y JSON-LD desde el cliente.
 *
 * Escribe exactamente los mismos elementos que la capa del edge deja puestos
 * —los busca por selector y los actualiza— para que no haya dos títulos ni dos
 * canónicas cuando React monta sobre una página ya renderizada.
 *
 * Sin `url` explícita (registro cargando o inexistente) la canónica es la
 * propia ruta, nunca la portada: apuntarla a la portada marca cada página como
 * duplicada de ella.
 */

export const SITE_NAME = site.name;
export const BASE_URL = site.url;
const DEFAULT_OG_IMAGE = `${site.url}${site.ogImage}`;

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: object | object[];
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: object | object[]) {
  let el = document.querySelector(`script[data-jsonld="${id}"]`) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-jsonld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.querySelector(`script[data-jsonld="${id}"]`)?.remove();
}

export function useSEO({ title, description, image, url, type = 'website', noindex = false, jsonLd }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${site.tagline}`;
    const fullDescription = description || site.description;
    const fullImage = image || DEFAULT_OG_IMAGE;
    const path = url ?? window.location.pathname;
    const fullUrl = `${BASE_URL}${path}`;

    document.title = fullTitle;

    setMeta('description', fullDescription);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    setMeta('og:title', fullTitle, true);
    setMeta('og:description', fullDescription, true);
    setMeta('og:image', fullImage, true);
    setMeta('og:url', fullUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:locale', site.locale, true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', fullDescription);
    setMeta('twitter:image', fullImage);
    if (site.twitter) {
      setMeta('twitter:site', site.twitter);
      setMeta('twitter:creator', site.twitter);
    }

    setLink('canonical', fullUrl);

    const ldId = 'page-jsonld';
    if (jsonLd) setJsonLd(ldId, jsonLd);
    else removeJsonLd(ldId);

    return () => removeJsonLd(ldId);
  }, [title, description, image, url, type, noindex, jsonLd]);
}
