import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
// Inter autoalojada: antes venía de fonts.googleapis.com como hoja bloqueante
// del render, un viaje a un tercero en cada página. Vite la sirve desde
// /assets con hash y caché inmutable. Solo el subconjunto latin y los cuatro
// pesos que usa la UI (400, medium, semibold, bold).
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './index.css';

// Si la app arranca, la recarga por fragmento caducado hizo su trabajo: se
// suelta el candado para que la próxima vez vuelva a estar disponible.
try { sessionStorage.removeItem('chunk-reload'); } catch { /* modo privado */ }

// El HTML del servidor trae contenido dentro de #root para quien no ejecuta
// JavaScript. Se vacía de una vez antes de montar: si lo quita React nodo a
// nodo y algo externo ya tocó el DOM, falla con "removeChild".
const container = document.getElementById('root')!;
container.innerHTML = '';

createRoot(container).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
