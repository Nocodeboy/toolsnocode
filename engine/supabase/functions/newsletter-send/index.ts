import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';
import { esc, fromAddress, layout } from '../_shared/email.ts';

/**
 * Manda una edición del boletín a la lista.
 *
 *   POST { slug?, test_to?, dry_run? }   cabecera X-Digest-Secret
 *
 * Sin `slug` coge la última edición publicada. Con `test_to` manda solo a esa
 * dirección y no registra nada: es la prueba antes del envío de verdad.
 * `dry_run` devuelve a cuánta gente iría y no envía.
 *
 * Lo que impide un envío duplicado no es el código sino el índice único de
 * `newsletter_sends`: si una tanda se corta por la mitad y se reintenta, los
 * que ya tienen fila quedan fuera. Las tandas son de cien porque es el máximo
 * que acepta el envío por lotes de Resend.
 *
 * Cada correo lleva su propio enlace de baja, en el cuerpo y en la cabecera
 * `List-Unsubscribe`, que es lo que hace que Gmail muestre el botón de darse
 * de baja en vez de el de marcar como spam.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const SITE = 'https://example.com';
const BATCH = 100;

interface Subscriber { id: string; email: string; token: string }

Deno.serve(async (req) => {
  const expected = Deno.env.get('DIGEST_SECRET');
  if (!expected || !(await secretsMatch(req.headers.get('X-Digest-Secret') ?? '', expected))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { slug?: unknown; test_to?: unknown; dry_run?: unknown };
  try { body = await req.json(); } catch { body = {}; }

  const query = supabase.from('news').select('id, slug, title, summary, content, published_at');
  const { data: edition } = typeof body.slug === 'string'
    ? await query.eq('slug', body.slug).maybeSingle()
    : await query.order('published_at', { ascending: false }).limit(1).maybeSingle();

  if (!edition) return Response.json({ error: 'no edition to send' }, { status: 404 });

  // Un boletín sin cuerpo es un correo vacío con el nombre del sitio: no sale.
  if (!edition.content || edition.content.trim().length < 200) {
    return Response.json({ error: 'the edition has no body to send', slug: edition.slug }, { status: 409 });
  }

  if (typeof body.test_to === 'string') {
    const one = { id: '00000000-0000-0000-0000-000000000000', email: body.test_to, token: '00000000-0000-0000-0000-000000000000' };
    const sent = await sendBatch(edition, [one]);
    return Response.json({ test: true, slug: edition.slug, result: sent[0] ?? null });
  }

  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, token')
    .eq('status', 'confirmed')
    .order('created_at');

  const { data: already } = await supabase
    .from('newsletter_sends')
    .select('subscriber_id')
    .eq('news_id', edition.id);

  const done = new Set((already ?? []).map((r) => r.subscriber_id));
  const pending = (subs ?? []).filter((s) => !done.has(s.id)) as Subscriber[];

  if (body.dry_run === true) {
    return Response.json({ dry_run: true, slug: edition.slug, title: edition.title, would_send: pending.length, already_sent: done.size });
  }
  if (pending.length === 0) {
    return Response.json({ ok: true, slug: edition.slug, sent: 0, already_sent: done.size, message: 'everyone on the list already has it' });
  }

  let sent = 0;
  const failures: { email: string; error: string }[] = [];

  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH);
    const results = await sendBatch(edition, chunk);
    const rows = [];
    for (const r of results) {
      if (r.id) sent++; else failures.push({ email: r.email, error: r.error ?? 'unknown' });
      rows.push({ news_id: edition.id, subscriber_id: r.subscriber_id, email_id: r.id ?? null, error: r.error ?? null });
    }
    // Se apunta antes de seguir: si la siguiente tanda revienta, lo enviado
    // queda registrado y el reintento no lo repite.
    if (rows.length) await supabase.from('newsletter_sends').insert(rows);
    const ids = chunk.map((s) => s.id);
    await supabase.from('newsletter_subscribers').update({ last_sent_at: new Date().toISOString() }).in('id', ids);
  }

  return Response.json({ ok: failures.length === 0, slug: edition.slug, title: edition.title, sent, failed: failures.length, failures: failures.slice(0, 10) });
});

interface SendResult { subscriber_id: string; email: string; id?: string; error?: string }

async function sendBatch(
  edition: { id: string; slug: string; title: string; summary: string | null; content: string },
  subs: Subscriber[],
): Promise<SendResult[]> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return subs.map((s) => ({ subscriber_id: s.id, email: s.email, error: 'RESEND_API_KEY missing' }));

  const payload = subs.map((s) => {
    const unsub = `${SITE}/newsletter/unsubscribe?token=${s.token}`;
    return {
      from: fromAddress(),
      to: [s.email],
      subject: edition.title,
      text: textBody(edition, unsub),
      html: layout(edition.title, htmlBody(edition, unsub)),
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    };
  });

  try {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsed = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (parsed as { message?: string }).message ?? `HTTP ${res.status}`;
      return subs.map((s) => ({ subscriber_id: s.id, email: s.email, error }));
    }
    const ids = ((parsed as { data?: { id: string }[] }).data ?? []);
    return subs.map((s, i) => ({ subscriber_id: s.id, email: s.email, id: ids[i]?.id, error: ids[i]?.id ? undefined : 'no id returned' }));
  } catch (err) {
    return subs.map((s) => ({ subscriber_id: s.id, email: s.email, error: String(err) }));
  }
}

/** El cuerpo se guarda como texto con párrafos separados por una línea en blanco. */
const paragraphs = (content: string) => content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

function htmlBody(edition: { slug: string; title: string; summary: string | null; content: string }, unsub: string): string {
  const body = paragraphs(edition.content)
    .map((p) => `<p style="margin:0 0 14px;">${esc(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
  return `<h1 style="font:700 20px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0 0 16px;">${esc(edition.title)}</h1>
${body}
<p style="margin:24px 0 0;"><a href="${SITE}/news/${esc(edition.slug)}" style="color:#047857;">Read this edition on the site</a> — every tool and category in it is linked there.</p>
<p style="margin:24px 0 0;color:#8a8a8e;font-size:12px;">You are getting this because you confirmed your subscription at example.com. <a href="${esc(unsub)}" style="color:#8a8a8e;">Unsubscribe</a>.</p>`;
}

function textBody(edition: { slug: string; title: string; content: string }, unsub: string): string {
  return [
    edition.title,
    '',
    paragraphs(edition.content).join('\n\n'),
    '',
    `Read it on the site: ${SITE}/news/${edition.slug}`,
    '',
    `Unsubscribe: ${unsub}`,
  ].join('\n');
}
