import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { entity } from '../site.config';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

/**
 * Carga diferida de cada ruta, con una recarga de cortesía.
 *
 * Los trozos de JavaScript llevan un hash en el nombre y desaparecen al
 * desplegar. Una pestaña abierta antes del despliegue revienta al navegar a la
 * siguiente ruta: "Failed to fetch dynamically imported module", y detrás de
 * eso aparecen errores que parecen otra cosa —un hook inválido, un
 * `removeChild` fallido— porque conviven dos copias de React.
 *
 * Así que se recarga una vez, y solo una: el bloqueo en `sessionStorage` evita
 * el bucle infinito cuando el fallo es real y no un despliegue. `main.tsx` lo
 * limpia al arrancar.
 */
function lazyRoute<T extends { default: React.ComponentType<unknown> }>(factory: () => Promise<T>) {
  return lazy(() => factory().catch((error: unknown) => {
    const KEY = 'chunk-reload';
    try {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
    } catch { /* sin almacenamiento: que suba el error */ }
    throw error;
  }));
}

const HomePage = lazyRoute(() => import('./pages/HomePage'));
const IndexPage = lazyRoute(() => import('./pages/IndexPage'));
const DetailPage = lazyRoute(() => import('./pages/DetailPage'));
const CategoriesPage = lazyRoute(() => import('./pages/CategoriesPage'));
const CategoryPage = lazyRoute(() => import('./pages/CategoryPage'));
const BlogPage = lazyRoute(() => import('./pages/BlogPage'));
const PostPage = lazyRoute(() => import('./pages/PostPage'));
const NotFoundPage = lazyRoute(() => import('./pages/NotFoundPage'));

const Loading = () => (
  <div className="flex items-center justify-center py-32">
    <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path={`/${entity.path}`} element={<IndexPage />} />
              <Route path={`/${entity.path}/:slug`} element={<DetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:slug" element={<CategoryPage />} />
              <Route path="/categories/:slug/:facet" element={<CategoryPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<PostPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
