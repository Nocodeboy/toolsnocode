/**
 * Rotación de los destacados.
 *
 * "Editor's picks" es un conjunto elegido a mano, así que ordenarlo por fecha
 * de alta es un criterio prestado que no dice nada: deja siempre fuera a las
 * mismas fichas por haber entrado antes en la base. Con más destacadas que
 * huecos en la portada, la rotación semanal reparte la exposición y hace que
 * la página con más enlaces entrantes del sitio cambie sola cada lunes.
 *
 * Es determinista: servidor y cliente calculan la misma semana, así que el
 * HTML inyectado y lo que pinta React coinciden y no hay parpadeo.
 */

/** Semanas completas desde el epoch. Cambia los lunes a las 00:00 UTC. */
export function weekIndex(now: Date = new Date()): number {
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  // El epoch cayó en jueves; el desplazamiento mueve el corte al lunes.
  return Math.floor((now.getTime() + 3 * 24 * 60 * 60 * 1000) / MS_WEEK);
}

export function rotateWeekly<T>(items: T[], take: number, now?: Date): T[] {
  if (items.length <= take) return items;
  const offset = ((weekIndex(now) % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)].slice(0, take);
}
