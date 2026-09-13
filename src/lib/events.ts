import { supabase } from './supabase';

type ToolEventType = 'detail_view' | 'outbound_click';

/**
 * Registra un evento de una herramienta. Dispara y olvida: la analítica nunca
 * debe romper la navegación ni retrasar un clic saliente, así que los fallos se
 * tragan en silencio (una promesa rechazada aquí no aporta nada al usuario).
 */
export function trackToolEvent(eventType: ToolEventType, toolId: string, isBoosted = false): void {
  if (!toolId) return;

  void supabase
    .from('tool_events')
    .insert({
      tool_id: toolId,
      event_type: eventType,
      is_boosted: isBoosted,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
    })
    .then(undefined, () => {});
}
