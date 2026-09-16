import type Stripe from 'npm:stripe@17.7.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.1';

/**
 * Toda la lógica que convierte una suscripción de Stripe en un Boost.
 *
 * Vive fuera del webhook porque el webhook no es la única puerta: un pago que
 * entró por un Payment Link, un evento que Stripe no reenvió, una incidencia
 * que alguien resuelve a mano — todos necesitan "resincroniza a este cliente"
 * sin fabricar un evento firmado. `stripe-resync` importa esto mismo.
 *
 * Regla de la casa: ningún camino que decida "no puedo entregar esto" termina
 * en un console.error. Termina en `stripe_incidents`, que se consulta.
 */
export function createBoostSync(stripe: Stripe, supabase: SupabaseClient) {
  async function recordIncident(
    customerId: string,
    subscriptionId: string | null,
    reason: string,
    detail: Record<string, unknown> = {},
  ) {
    console.error(`[incident] ${reason} customer=${customerId}`, detail);
    const { error } = await supabase
      .from('stripe_incidents')
      .insert({ customer_id: customerId, subscription_id: subscriptionId, reason, detail });
    if (error) console.error('Could not record incident:', error);
  }

  async function resolveIncidents(customerId: string) {
    await supabase
      .from('stripe_incidents')
      .update({ resolved_at: new Date().toISOString() })
      .eq('customer_id', customerId)
      .is('resolved_at', null);
  }

  /**
   * Quién es el cliente, con red de seguridad.
   *
   * `stripe_customers` solo tiene filas de quien pasó por el checkout de la
   * app. Un pago por Payment Link o desde el panel de Stripe crea el cliente
   * en Stripe y nada aquí. Stripe sí conoce el email; con el email se llega al
   * usuario, y de paso se escribe la fila que faltaba.
   */
  async function resolveUserId(customerId: string, subscriptionId: string | null): Promise<string | null> {
    const { data: mapped } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (mapped?.user_id) return mapped.user_id;

    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !customer.email) {
      await recordIncident(customerId, subscriptionId, 'customer_has_no_email');
      return null;
    }

    const { data: userId, error } = await supabase.rpc('user_id_by_email', { p_email: customer.email });
    if (error || !userId) {
      await recordIncident(customerId, subscriptionId, 'no_user_with_customer_email', { email: customer.email });
      return null;
    }

    const { error: insertError } = await supabase
      .from('stripe_customers')
      .insert({ user_id: userId, customer_id: customerId });
    if (insertError) {
      console.error(`Resolved ${customerId} by email but could not store the mapping:`, insertError);
    } else {
      console.info(`Stripe customer ${customerId} mapped to user ${userId} by email`);
    }

    return userId;
  }

  async function activateBoost(customerId: string, subscription: Stripe.Subscription) {
    const userId = await resolveUserId(customerId, subscription.id);
    if (!userId) return false;

    // Sin `tool_id` en los metadatos (Payment Link, panel de Stripe) solo hay
    // una lectura segura: si el maker tiene una única herramienta, es esa. Con
    // varias no se adivina; queda como incidencia y lo decide una persona.
    let toolId: string | undefined = subscription.metadata?.tool_id;
    if (!toolId) {
      const { data: owned } = await supabase.from('tools').select('id, name').eq('user_id', userId).limit(2);
      if (owned?.length === 1) {
        toolId = owned[0].id;
        console.info(`No tool_id on subscription; user owns exactly one tool (${owned[0].name}), boosting it`);
      } else {
        await recordIncident(customerId, subscription.id, 'no_tool_id_and_ambiguous_owner', {
          user_id: userId,
          tools_owned: owned?.length ?? 0,
        });
        return false;
      }
    }

    const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

    const { error, count } = await supabase
      .from('tools')
      .update({ is_boosted: true, boost_expires_at: expiresAt, boost_plan: 'boost' }, { count: 'exact' })
      .eq('id', toolId)
      .eq('user_id', userId);

    if (error) {
      await recordIncident(customerId, subscription.id, 'boost_update_failed', { tool_id: toolId, error: error.message });
      return false;
    }
    if (!count) {
      await recordIncident(customerId, subscription.id, 'tool_not_owned_by_user', { tool_id: toolId, user_id: userId });
      return false;
    }

    console.info(`Boost activated for tool ${toolId} until ${expiresAt}`);
    await resolveIncidents(customerId);
    return true;
  }

  async function deactivateBoostForCustomer(customerId: string, toolId?: string) {
    const userId = await resolveUserId(customerId, null);
    if (!userId) return;

    let query = supabase
      .from('tools')
      .update({ is_boosted: false, boost_expires_at: null, boost_plan: '' })
      .eq('user_id', userId)
      .eq('is_boosted', true);
    if (toolId) query = query.eq('id', toolId);

    const { error } = await query;
    if (error) console.error('Error deactivating boost:', error);
    else console.info(`Boost deactivated for customer ${customerId}${toolId ? ` tool ${toolId}` : ''}`);
  }

  async function syncCustomerFromStripe(customerId: string) {
    // `limit: 1` cogía la suscripción más reciente, que no es necesariamente la
    // que está pagando. Se piden varias y se elige por estado.
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      const { error } = await supabase
        .from('stripe_subscriptions')
        .upsert({ customer_id: customerId, status: 'not_started' }, { onConflict: 'customer_id' });
      if (error) throw new Error(`Failed to record not_started: ${error.message}`);
      await deactivateBoostForCustomer(customerId);
      return { status: 'not_started', boosted: false };
    }

    const LIVE = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];
    const subscription = subscriptions.data.find((s) => LIVE.includes(s.status)) ?? subscriptions.data[0];
    const pm = subscription.default_payment_method;

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(pm && typeof pm !== 'string'
          ? { payment_method_brand: pm.card?.brand ?? null, payment_method_last4: pm.card?.last4 ?? null }
          : {}),
        status: subscription.status,
      },
      { onConflict: 'customer_id' },
    );
    if (subError) throw new Error(`Failed to sync subscription: ${subError.message}`);

    let boosted = false;
    if (['active', 'trialing'].includes(subscription.status)) {
      boosted = await activateBoost(customerId, subscription);
    } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
      // `past_due` no entra aquí: Stripe reintenta durante semanas antes de
      // pasar a `unpaid`. Apagar al primer fallo quitaba lo pagado por una
      // tarjeta que casi siempre acaba pasando.
      await deactivateBoostForCustomer(customerId, subscription.metadata?.tool_id);
    } else if (subscription.status === 'past_due') {
      console.info(`Customer ${customerId} is past_due; boost kept while Stripe retries`);
    }

    return { status: subscription.status, subscription_id: subscription.id, boosted };
  }

  async function deactivateExpiredBoosts() {
    const { error, count } = await supabase
      .from('tools')
      .update({ is_boosted: false, boost_expires_at: null, boost_plan: '' }, { count: 'exact' })
      .eq('is_boosted', true)
      .lt('boost_expires_at', new Date().toISOString());
    if (error) console.error('Error deactivating expired boosts:', error);
    else if (count) console.info(`Deactivated ${count} expired boosts`);
  }

  return { syncCustomerFromStripe, deactivateExpiredBoosts };
}

/** Comparación en tiempo constante: la longitud de un secreto no se filtra por cuánto tarda en fallar. */
export async function secretsMatch(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
