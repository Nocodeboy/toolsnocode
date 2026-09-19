import { useState, type FormEvent } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter`;

interface Props {
  /** De dónde salió el alta, para saber qué sitio del sitio convierte. */
  source: string;
  className?: string;
}

/**
 * Alta del boletín.
 *
 * Lo que llega al servidor es solo la dirección: la confirmación va por correo
 * y el estado real lo decide ese enlace, no este formulario. Por eso el mensaje
 * de éxito dice "mira el buzón" y no "ya estás suscrito", y por eso es el mismo
 * para una dirección nueva que para una que ya estaba — si dijera algo
 * distinto, cualquiera podría usar el formulario para comprobar quién está en
 * la lista.
 */
export default function NewsletterSignup({ source, className = '' }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    setError(null);
    setState('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'That did not go through. Try again in a moment.');
        setState('idle');
        return;
      }
      setState('sent');
    } catch {
      setError('That did not go through. Try again in a moment.');
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
            <Check className="w-4 h-4 text-brand-400" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Check your inbox</h3>
            <p className="text-sm text-surface-400">
              There is a link waiting to confirm the subscription. Nothing is sent until you open it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
          <Mail className="w-4 h-4 text-brand-400" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">One edition a week</h3>
          <p className="text-sm text-surface-400">
            What actually came into the directory this week and what it says about where the tooling is going.
            Written from the data, not from press releases.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field flex-1"
        />
        <button type="submit" disabled={state === 'sending'} className="btn-primary text-sm justify-center disabled:opacity-60">
          {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {state === 'sending' ? 'Sending' : 'Subscribe'}
        </button>
      </form>

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <p className="text-xs text-surface-500 mt-3">
        Double opt-in, one email a week, unsubscribe link in every one.
      </p>
    </div>
  );
}
