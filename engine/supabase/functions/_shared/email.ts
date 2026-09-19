/**
 * Envío de correo transaccional por Resend.
 *
 * Todo lo que sale del sitio pasa por aquí: una sola plantilla, un solo
 * remitente y un solo sitio donde mirar cuando algo no llega.
 *
 * Nunca lanza. Un correo que no sale no puede tumbar la operación que lo
 * provocó — aprobar una reclamación tiene que quedar aprobada aunque el aviso
 * se pierda —, así que devuelve el fallo y lo deja escrito en el log.
 */

const ENDPOINT = 'https://api.resend.com/emails';

export interface Mail {
  to: string | string[];
  subject: string;
  /** Cuerpo en texto plano. Obligatorio: un correo sin él acaba en spam. */
  text: string;
  /** Contenido del cuerpo HTML, sin la envoltura: la pone `layout()`. */
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface MailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export function fromAddress(): string {
  return Deno.env.get('EMAIL_FROM') ?? 'Directory <hello@example.com>';
}

/** A quién se avisa de lo que pasa en el sitio. Sin esto, nadie se entera. */
export function operatorEmail(): string | null {
  return Deno.env.get('OPERATOR_EMAIL') ?? null;
}

export async function sendEmail(mail: Mail): Promise<MailResult> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) {
    console.error('email: RESEND_API_KEY no está puesto; no se envía nada');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: layout(mail.subject, mail.html),
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        ...(mail.headers ? { headers: mail.headers } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (body as { message?: string }).message ?? `HTTP ${res.status}`;
      console.error('email: Resend rechazó el envío:', error);
      return { ok: false, error };
    }
    return { ok: true, id: (body as { id?: string }).id };
  } catch (err) {
    console.error('email: el envío falló:', err);
    return { ok: false, error: String(err) };
  }
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Envoltura del correo. Tablas y estilos en línea porque los clientes de
 * correo no aplican hojas de estilo, y en claro porque un correo oscuro se
 * ve mal en la mitad de ellos.
 */
export function layout(title: string, content: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5ea;border-radius:12px;">
        <tr><td style="padding:24px 28px 8px;font:600 16px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
          <a href="https://example.com" style="color:#111;text-decoration:none;">Tools<span style="color:#10b981;">NoCode</span></a>
        </td></tr>
        <tr><td style="padding:8px 28px 24px;font:400 15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333;">
          ${content}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:16px 28px;font:400 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#8a8a8e;">
          Directory — <a href="https://example.com" style="color:#8a8a8e;">example.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Botón. Un enlace con relleno, que es lo único que renderiza igual en todas partes. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#10b981;border-radius:8px;">
  <a href="${esc(href)}" style="display:inline-block;padding:11px 20px;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#052e1f;text-decoration:none;">${esc(label)}</a>
</td></tr></table>`;
}
