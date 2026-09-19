import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { entity, site } from '../../site.config';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <header className="border-b border-surface-800/60">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-white">{site.name}</Link>
          <div className="flex items-center gap-5 text-sm text-surface-300">
            <Link to={`/${entity.path}`} className="hover:text-white transition-colors">All</Link>
            <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-surface-800/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-surface-500 flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <div className="flex gap-4">
            <Link to="/legal/privacy" className="hover:text-surface-300">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-surface-300">Terms</Link>
            <a href="/feed.xml" className="hover:text-surface-300">RSS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
