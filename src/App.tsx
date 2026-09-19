import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code-splitting
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
const ToolFormPage = lazy(() => import('./pages/ToolFormPage'));
const ExpertsPage = lazy(() => import('./pages/ExpertsPage'));
const ExpertDetailPage = lazy(() => import('./pages/ExpertDetailPage'));
const ExpertFormPage = lazy(() => import('./pages/ExpertFormPage'));
const TutorialsPage = lazy(() => import('./pages/TutorialsPage'));
const TutorialDetailPage = lazy(() => import('./pages/TutorialDetailPage'));
const TutorialFormPage = lazy(() => import('./pages/TutorialFormPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const SuccessPage = lazy(() => import('./pages/SuccessPage').then(m => ({ default: m.SuccessPage })));

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
