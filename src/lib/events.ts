import { supabase } from './supabase';

type ToolEventType = 'detail_view' | 'outbound_click';

/**
 * Registra un evento de una herramienta a través de la edge function
 * `track-event`, no escribiendo en la tabla: la anon key es pública, así que un
 * INSERT directo dejaría que cualquiera fabricase las métricas con las que se
 * justifica el precio del Boost. La función limita el ritmo y deriva
 * `is_boosted` del servidor.
 *
 * Dispara y olvida: la analítica nunca debe romper la navegación ni retrasar un
 * clic saliente, así que los fallos se tragan en silencio.
 */
export function trackToolEvent(eventType: ToolEventType, toolId: string): void {
  if (!toolId) return;

  void supabase.functions
    .invoke('track-event', { body: { tool_id: toolId, event_type: eventType } })
    .then(undefined, () => {});
}
