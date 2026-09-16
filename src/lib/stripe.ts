import { supabase } from './supabase';

export async function createCheckoutSession(priceId: string, mode: 'subscription' | 'payment', toolId?: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const body: Record<string, string> = {
    price_id: priceId,
    mode,
    success_url: `${window.location.origin}/success`,
    cancel_url: `${window.location.origin}/pricing`,
  };

  if (toolId) {
    body.tool_id = toolId;
  }

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body,
  });

  if (error) {
    throw new Error(error.message || 'Checkout failed');
  }

  return data;
}
/**
 * Abre el portal de facturación de Stripe: cancelar, cambiar de tarjeta, ver
 * facturas. Hasta ahora "Manage Subscription" llevaba a /account, que no sabía
 * nada de pagos, y un cliente no tenía forma de cancelar desde el sitio.
 */
export async function openBillingPortal(returnPath = '/account?tab=billing') {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');

  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: { return_url: `${window.location.origin}${returnPath}` },
  });

  if (error) throw new Error(error.message || 'Could not open the billing portal');
  if (!data?.url) throw new Error(data?.error || 'Could not open the billing portal');
  return data.url as string;
}
