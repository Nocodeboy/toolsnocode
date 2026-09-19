import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;

/**
 * El cuerpo que inyecta la capa de SEO vive dentro de `#root`. Se vacía de una
 * sola asignación en vez de dejar que React vaya quitando nodos uno a uno:
 * con el HTML inyectado, el reconciliador intentaba `removeChild` sobre nodos
 * que ya no eran suyos y reventaba en producción.
 */
root.innerHTML = '';

// Un despliegue deja sin efecto el bloqueo de recarga de `lazyRoute`.
try { sessionStorage.removeItem('chunk-reload'); } catch { /* sin almacenamiento, da igual */ }

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
