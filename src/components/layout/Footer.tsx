import { Link } from 'react-router-dom';
import { Zap, Github, Twitter } from 'lucide-react';

// `ai` y `growth` no son slugs de ninguna categoría. `ToolsPage` resuelve el
// parámetro contra la tabla y, al no encontrar nada, no aplicaba ningún filtro:
// cinco enlaces del pie llevaban al listado completo haciéndose pasar por una
// selección. Ahora apuntan a las fichas de categoría, que sí existen.
const footerLinks = {
  Discover: [
    { label: 'All Categories', href: '/categories' },
    { label: 'Marketing Tools', href: '/categories/marketing' },
    { label: 'Automation Tools', href: '/categories/automation' },
    { label: 'Trending', href: '/tools?sort=trending' },
  ],
  Community: [
    { label: 'Experts', href: '/experts' },
    { label: 'Projects', href: '/projects' },
    { label: 'Tutorials', href: '/tutorials' },
    { label: 'Submit a Tool', href: '/tools/new' },
  ],
  Resources: [
    { label: 'No-Code Tools', href: '/categories/no-code' },
    { label: 'AI Coding Tools', href: '/categories/coding' },
    { label: 'AI Image Generators', href: '/categories/image-generation' },
    { label: 'News', href: '/news' },
    { label: 'Boost Your Tool', href: '/pricing' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-surface-800/50 bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Tools<span className="text-brand-400">NoCode</span>
              </span>
            </Link>
            <p className="text-sm text-surface-500 leading-relaxed mb-6">
              The discovery layer for the AI Builder Economy. Find tools, experts, and resources.
            </p>
            <div className="flex gap-3">
              <a href="https://x.com/Nocodeboy" target="_blank" rel="noopener noreferrer" className="p-2 text-surface-500 hover:text-surface-200 bg-surface-900 rounded-lg border border-surface-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com/Nocodeboy" target="_blank" rel="noopener noreferrer" className="p-2 text-surface-500 hover:text-surface-200 bg-surface-900 rounded-lg border border-surface-800 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-surface-200 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-surface-500 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-600">
            {new Date().getFullYear()} ToolsNoCode. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Link to="/legal/privacy" className="text-sm text-surface-600 hover:text-brand-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/legal/terms" className="text-sm text-surface-600 hover:text-brand-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/legal/cookies" className="text-sm text-surface-600 hover:text-brand-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
