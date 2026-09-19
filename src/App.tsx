import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * `lazy()` que sobrevive a un despliegue.
 *
 * Los ficheros de `/assets` llevan hash y desaparecen cuando se publica una
 * versión nueva. Una pestaña abierta desde antes sigue pidiendo los nombres
 * viejos, así que la primera navegación a una ruta diferida lanza "Failed to
 * fetch dynamically imported module" y el usuario ve la pantalla de error. De
 * 56 errores registrados en producción, 34 eran exactamente eso, y otros 18
 * eran el mismo problema por la otra cara: un fragmento antiguo cargado junto
 * a uno nuevo deja dos copias de React y React lanza "invalid hook call".
 *
 * Recargar trae el HTML actual con los nombres actuales. El candado en
 * `sessionStorage` evita el bucle si la recarga no arregla nada: a la segunda
 * se deja pasar el error y salta el ErrorBoundary, que sí es informativo.
 */
function lazyRoute<T extends { default: React.ComponentType<unknown> }>(factory: () => Promise<T>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const KEY = 'chunk-reload';
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
      throw error;
    }),
  );
}

// Lazy-loaded pages for code-splitting
const ToolsPage = lazyRoute(() => import('./pages/ToolsPage'));
const CategoriesPage = lazyRoute(() => import('./pages/CategoriesPage'));
const CategoryPage = lazyRoute(() => import('./pages/CategoryPage'));
const ToolDetailPage = lazyRoute(() => import('./pages/ToolDetailPage'));
const ToolFormPage = lazyRoute(() => import('./pages/ToolFormPage'));
const ExpertsPage = lazyRoute(() => import('./pages/ExpertsPage'));
const ExpertDetailPage = lazyRoute(() => import('./pages/ExpertDetailPage'));
const ExpertFormPage = lazyRoute(() => import('./pages/ExpertFormPage'));
const TutorialsPage = lazyRoute(() => import('./pages/TutorialsPage'));
const TutorialDetailPage = lazyRoute(() => import('./pages/TutorialDetailPage'));
const TutorialFormPage = lazyRoute(() => import('./pages/TutorialFormPage'));
const ProjectsPage = lazyRoute(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazyRoute(() => import('./pages/ProjectDetailPage'));
const ProjectFormPage = lazyRoute(() => import('./pages/ProjectFormPage'));
const AuthPage = lazyRoute(() => import('./pages/AuthPage'));
const FavoritesPage = lazyRoute(() => import('./pages/FavoritesPage'));
const AccountPage = lazyRoute(() => import('./pages/AccountPage'));
const PrivacyPolicyPage = lazyRoute(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage = lazyRoute(() => import('./pages/CookiePolicyPage'));
const TermsOfServicePage = lazyRoute(() => import('./pages/TermsOfServicePage'));
const NewsPage = lazyRoute(() => import('./pages/NewsPage'));
const NewsDetailPage = lazyRoute(() => import('./pages/NewsDetailPage'));
const NotFoundPage = lazyRoute(() => import('./pages/NotFoundPage'));
const LoginPage = lazyRoute(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazyRoute(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const PricingPage = lazyRoute(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const SuccessPage = lazyRoute(() => import('./pages/SuccessPage').then(m => ({ default: m.SuccessPage })));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                <Route path="pricing" element={<PricingPage />} />
                <Route
                  path="success"
                  element={
                    <ProtectedRoute>
                      <SuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="categories/:slug" element={<CategoryPage />} />
                <Route path="categories/:slug/:pricing" element={<CategoryPage />} />
                <Route path="tools" element={<ToolsPage />} />
                <Route path="tools/new" element={<ToolFormPage />} />
                <Route path="tools/:slug/edit" element={<ToolFormPage />} />
                <Route path="tools/:slug" element={<ToolDetailPage />} />
                <Route path="experts" element={<ExpertsPage />} />
                <Route path="experts/new" element={<ExpertFormPage />} />
                <Route path="experts/:slug/edit" element={<ExpertFormPage />} />
                <Route path="experts/:slug" element={<ExpertDetailPage />} />
                <Route path="tutorials" element={<TutorialsPage />} />
                <Route path="tutorials/new" element={<TutorialFormPage />} />
                <Route path="tutorials/:slug/edit" element={<TutorialFormPage />} />
                <Route path="tutorials/:slug" element={<TutorialDetailPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/new" element={<ProjectFormPage />} />
                <Route path="projects/:slug/edit" element={<ProjectFormPage />} />
                <Route path="projects/:slug" element={<ProjectDetailPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="news/:slug" element={<NewsDetailPage />} />
                <Route path="legal/privacy" element={<PrivacyPolicyPage />} />
                <Route path="legal/terms" element={<TermsOfServicePage />} />
                <Route path="legal/cookies" element={<CookiePolicyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
