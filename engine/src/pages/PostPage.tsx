import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { site } from '../../site.config';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import type { Post } from '../types';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from('posts').select('*').eq('slug', slug).maybeSingle().then(({ data, error }) => {
      if (!data && !error) setNotFound(true);
      setPost(data as Post | null);
    });
  }, [slug]);

  const jsonLd = useMemo(() => (post ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.published_at,
    description: post.summary,
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  } : undefined), [post]);

  useSEO({
    title: post?.title,
    description: post?.summary,
    url: post ? `/blog/${post.slug}` : undefined,
    type: 'article',
    noindex: notFound,
    jsonLd,
  });

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">{notFound ? 'Not found' : 'Loading…'}</h1>
        {notFound && <Link to="/blog" className="btn-primary">Back to the blog</Link>}
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-3">{post.title}</h1>
      <p className="text-sm text-surface-500 mb-8">{new Date(post.published_at).toLocaleDateString()}</p>
      <div className="space-y-4 text-surface-300 leading-relaxed">
        {post.content.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  );
}
