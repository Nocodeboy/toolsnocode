/*
  # Resolver un usuario por email desde el webhook de Stripe

  El 18 de junio de 2026 alguien pagó 49,90 $ por un Boost anual. La
  suscripción `sub_1RbDXjIs6L3hD9y6cLjWmGfG` sigue activa en Stripe hasta junio
  de 2027. Su herramienta nunca se impulsó.

  El webhook busca `user_id` en `stripe_customers` por `customer_id`. Ese
  cliente no tiene fila ahí: no pasó por el checkout de la aplicación (que es
  quien crea la fila) sino por otro camino — un Payment Link o el panel de
  Stripe. `activateBoost()` no encontró usuario, escribió un `console.error`
  que nadie leyó, y devolvió. Tres meses.

  Hay otra suscripción con un `price_id` que nunca ha existido en el código,
  así que ese segundo camino de pago existe y se ha usado más de una vez.

  Esta función es el eslabón que faltaba: dado el email que Stripe sí tiene,
  devuelve el `user_id`. `auth.users` no está expuesto por PostgREST, así que
  es SECURITY DEFINER y solo lo ejecuta `service_role`.
*/

CREATE OR REPLACE FUNCTION public.user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

COMMENT ON FUNCTION public.user_id_by_email(text) IS
  'Solo para el webhook de Stripe: resuelve un pago hecho fuera del checkout de la app.';

-- SECURITY DEFINER es ejecutable por cualquiera salvo que se revoque, y en
-- Supabase `anon` y `authenticated` reciben EXECUTE por privilegios por defecto
-- del esquema. Sin esto, cualquiera podría enumerar usuarios por email.
REVOKE EXECUTE ON FUNCTION public.user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_id_by_email(text) TO service_role;
