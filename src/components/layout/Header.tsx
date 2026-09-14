import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, User, LogOut, Heart, Settings, Rocket, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { name: 'Tools', href: '/tools' },
  { name: 'Categories', href: '/categories' },
  { name: 'Experts', href: '/experts' },
  { name: 'Tutorials', href: '/tutorials' },
  { name: 'Projects', href: '/projects' },
  { name: 'News', href: '/news' },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <Link
        to="/pricing"
        className="block w-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:via-brand-400 hover:to-emerald-400 transition-all duration-300 group"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-3 text-center">
          <Rocket className="w-3.5 h-3.5 text-white/90 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-white">
            <span className="font-semibold">Get ahead of your competition</span>
            <span className="hidden sm:inline text-white/85"> — Boost your tool and appear first in every listing.</span>
          </p>
          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-white/90 group-hover:text-white transition-colors flex-shrink-0">
            See plans <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>
      <div className="bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Tools<span className="text-brand-400">NoCode</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{user.email?.split('@')[0]}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-900 border border-surface-800 shadow-xl z-50 py-1">
                      <div className="px-4 py-3 border-b border-surface-800">
                        <p className="text-sm font-medium text-surface-200 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Account
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        Favorites
                      </Link>
                      <div className="border-t border-surface-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-surface-800/50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-surface-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-surface-800/50 bg-surface-950/95 backdrop-blur-xl border-b border-surface-800/50">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {!user && (
              <div className="pt-3 border-t border-surface-800 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </header>
  );
}
