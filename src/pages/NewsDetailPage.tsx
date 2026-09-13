import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink, Tag, Clock, Twitter, Linkedin, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import type { NewsArticle } from '../types';

const SITE_URL = 'https://toolsnocode.com';

const categoryColors: Record<string, string> = {
  'AI Models': 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  'No-Code Tools': 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  'Industry': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Research': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Policy': 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Enlaces en línea estilo markdown dentro del contenido de una noticia.
 *
 * El boletín semanal menciona decenas de herramientas por entrega, y cada
 * mención debe ser un enlace real: hoy solo ~24 fichas son alcanzables desde la
 * home, así que este es el enlazado interno que le falta al directorio.
 *
 * Solo se aceptan rutas internas (`/...`) y `https://`. Cualquier otra cosa se
 * queda como texto plano: el contenido de `news` lo escriben rutinas del
 * servidor, pero un renderizador que acepte cualquier esquema es un
 * `javascript:` esperando a que alguien se equivoque.
 */
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text: string, keyPrefix: string) {
  const parts: Array<string | JSX.Element> = [];
  let last = 0;

  for (const m of text.matchAll(LINK_RE)) {
    const [full, label, href] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));

    if (href.startsWith('/')) {
      parts.push(<Link key={`${keyPrefix}-${at}`} to={href} className="text-brand-400 hover:text-brand-300 underline underline-offset-2">{label}</Link>);
    } else if (href.startsWith('https://')) {
      parts.push(<a key={`${keyPrefix}-${at}`} href={href} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">{label}</a>);
    } else {
      parts.push(full);
    }

    last = at + full.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((para, i) => {
    if (para.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">{para.replace('## ', '')}</h2>;
    }
    if (para.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold text-surface-100 mt-6 mb-2">{para.replace('### ', '')}</h3>;
    }
    if (para.startsWith('- ') || para.startsWith('* ')) {
      const items = para.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 my-4 text-surface-300">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item.replace(/^[-*] /, ''), `ul-${i}-${j}`)}</li>
          ))}
        </ul>
      );
    }
    if (para.match(/^\d+\. /)) {
      const items = para.split('\n').filter(l => l.match(/^\d+\. /));
      return (
        <ol key={i} className="list-decimal list-inside space-y-1.5 my-4 text-surface-300">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item.replace(/^\d+\. /, ''), `ol-${i}-${j}`)}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className="text-surface-300 leading-relaxed text-[15px] mb-4">
        {renderInline(para, `p-${i}`)}
      </p>
    );
  });
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        navigate('/news', { replace: true });
        return;
      }

      setArticle(data);

      const { data: relatedData } = await supabase
        .from('news')
        .select('*')
        .eq('category', data.category)
        .neq('id', data.id)
        .order('published_at', { ascending: false })
        .limit(3);

      setRelated(relatedData ?? []);
      setLoading(false);
    }
    load();
  }, [slug, navigate]);

  const mins = useMemo(() => {
    if (!article) return 1;
    return readingTime((article.content ?? '') + ' ' + article.summary);
  }, [article]);

  const articleUrl = `${SITE_URL}/news/${slug}`;

  const jsonLd = useMemo(() => {
    if (!article) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'News', item: 'https://toolsnocode.com/news' },
          { '@type': 'ListItem', position: 2, name: article.title },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.summary,
        image: article.image_url ? [article.image_url] : [],
        datePublished: article.published_at,
        dateModified: article.created_at,
        author: {
          '@type': 'Organization',
          name: article.source,
        },
        publisher: {
          '@type': 'Organization',
          name: 'ToolsNoCode',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/favicon.svg`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': articleUrl,
        },
        keywords: article.tags.join(', '),
        articleSection: article.category,
        url: articleUrl,
      },
    ];
  }, [article, articleUrl]);

  useSEO({
    title: article ? article.title : 'News',
    description: article?.summary ?? '',
    image: article?.image_url ?? undefined,
    url: `/news/${slug}`,
    type: 'article',
    jsonLd: jsonLd,
    // Un slug inexistente devuelve 200 con la shell del SPA: sin esto sería un soft-404.
    noindex: !loading && !article,
  });

  async function copyLink() {
    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tweetUrl = article
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`
    : '#';
  const linkedinUrl = article
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`
    : '#';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-surface-800 rounded w-24" />
          <div className="aspect-[16/7] bg-surface-800 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 bg-surface-800 rounded w-4/5" />
            <div className="h-8 bg-surface-800 rounded w-3/5" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const colorClass = categoryColors[article.category] ?? 'bg-surface-700/50 text-surface-300 border-surface-600/30';
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        <nav className="flex items-center gap-2 text-sm text-surface-500 mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-surface-300 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-surface-300 transition-colors">News</Link>
          <span>/</span>
          <span className="text-surface-400 truncate max-w-[200px]">{article.title}</span>
        </nav>

        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to News
        </Link>

        {article.image_url && (
          <figure className="mb-8 rounded-2xl overflow-hidden aspect-[16/7] bg-surface-800">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        )}

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
              {article.category}
            </span>
            <span className="text-sm font-medium text-surface-300">{article.source}</span>
            <span className="text-surface-600">·</span>
            <span className="flex items-center gap-1.5 text-xs text-surface-500">
              <Calendar className="w-3 h-3" />
              <time dateTime={article.published_at}>{formattedDate}</time>
            </span>
            {(article.content || article.summary) && (
              <>
                <span className="text-surface-600">·</span>
                <span className="flex items-center gap-1.5 text-xs text-surface-500">
                  <Clock className="w-3 h-3" />
                  {mins} min read
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-base text-surface-300 leading-relaxed">
            {article.summary}
          </p>
        </header>

        <div className="flex items-center justify-between py-4 border-y border-surface-800 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700/50 text-xs text-surface-400"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-xs text-surface-600 hidden sm:block">Share</span>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Twitter"
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700/50 text-surface-400 hover:text-sky-400 transition-all"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700/50 text-surface-400 hover:text-sky-500 transition-all"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={copyLink}
              aria-label="Copy link"
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700/50 text-surface-400 hover:text-brand-400 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <article className="prose-custom mb-12">
          {article.content ? (
            <div>{renderContent(article.content)}</div>
          ) : (
            <p className="text-surface-400 italic text-sm">
              Full article available at the original source.
            </p>
          )}
        </article>

        {article.url && (
          <div className="rounded-2xl bg-surface-900 border border-surface-700/50 p-6 mb-12">
            <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-3">Original Source</p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-surface-200 mb-1">{article.source}</p>
                <p className="text-xs text-surface-500 break-all">{article.url}</p>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read original
              </a>
            </div>
          </div>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-lg font-bold text-white mb-5">
              More from {article.category}
            </h2>
            <div className="space-y-3">
              {related.map((rel) => {
                const relColorClass = categoryColors[rel.category] ?? 'bg-surface-700/50 text-surface-300 border-surface-600/30';
                const relDate = new Date(rel.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <Link
                    key={rel.id}
                    to={`/news/${rel.slug}`}
                    className="group flex gap-4 p-4 rounded-xl bg-surface-900 border border-surface-700/50 hover:border-surface-600/80 transition-all duration-200 hover:bg-surface-800/60"
                  >
                    {rel.image_url && (
                      <img
                        src={rel.image_url}
                        alt={rel.title}
                        className="w-20 h-16 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${relColorClass}`}>
                          {rel.category}
                        </span>
                        <span className="text-xs text-surface-600">{relDate}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-surface-200 group-hover:text-brand-400 transition-colors leading-snug">
                        {rel.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
