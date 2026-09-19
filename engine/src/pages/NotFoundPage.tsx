import { Link } from 'react-router-dom';
import { entity } from '../../site.config';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  // La capa del edge ya contesta 404 de verdad para lo que no es ruta
  // conocida. Esto es lo que ve quien llega a una ruta válida sin contenido.
  useSEO({ title: 'Page not found', noindex: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-bold text-surface-800 mb-4">404</p>
      <h1 className="text-xl font-bold text-white mb-6">That page does not exist</h1>
      <Link to={`/${entity.path}`} className="btn-primary">Browse the directory</Link>
    </div>
  );
}
