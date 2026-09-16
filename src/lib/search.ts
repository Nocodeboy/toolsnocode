/**
 * Un `.or()` de PostgREST es un mini-lenguaje: comas separan condiciones,
 * paréntesis agrupan, puntos separan operador y valor. Interpolar lo que
 * escribe el usuario tal cual —`name.ilike.%${search}%`— significa que una
 * coma en la búsqueda añade una condición, y un paréntesis la rompe en un 400.
 * No escala privilegios (RLS sigue mandando), pero convierte el buscador en un
 * juguete y cualquier `"foo, bar"` en una página vacía.
 *
 * PostgREST admite valores entre comillas dobles, con `"` y `\` escapados
 * dentro. Eso es todo lo que hace esto.
 */
function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** `ilikeAny(['name','tagline'], term)` → cadena para `.or()` con el término escapado. */
export function ilikeAny(columns: readonly string[], term: string): string {
  const pattern = quoteFilterValue(`%${term.trim()}%`);
  return columns.map((c) => `${c}.ilike.${pattern}`).join(',');
}
