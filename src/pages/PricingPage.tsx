import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Rocket, TrendingUp, Play, Award, Search,
  ArrowRight, Check, Loader2, Zap, Star, ChevronDown,
  Eye, MousePointerClick, Trophy, Shield, Clock, Users, Wrench
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import type { Tool } from '../types';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Full-width card, first in line',
    description: 'A boosted tool takes the whole row at the top of the directory and of every category page, in its own violet card. Not a badge on a small tile: a different shape.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
  },
  {
    icon: Star,
    title: 'Boosted section on the homepage',
    description: 'A dedicated section under the hero, above Editor\'s Picks and everything else, with the same full-width card.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Play,
    title: 'Demo Video',
    description: 'Add a video demonstration to your tool page so users can see your product in action.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    icon: Award,
    title: 'Boosted Badge',
    description: 'A distinctive badge on your tool card signals quality and grabs attention instantly.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Search,
    title: 'Search Ranking',
    description: 'Boosted tools rank higher in search results, making your tool easier to find.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const faqs = [
  {
    q: 'What does "Boost" do for my tool?',
    a: 'Your tool becomes a full-width card at the top of the directory, of every category page, and of the Boosted section on the homepage; you can add a demo video to its page; and it carries a Boosted badge. Trending is the one list Boost does not touch — it is ranked by real visits and clicks only, which is what keeps it meaningful next to your card.',
  },
  {
    q: 'Do I need to own the tool to boost it?',
    a: "Yes. You must be the verified owner of the tool to subscribe to the Boost plan. If you haven't claimed your tool yet, you can do so from the tool's detail page.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. You can cancel your subscription at any time. Your boost benefits will remain active until the end of the current billing period.',
  },
  {
    q: 'What happens when my boost expires?',
    a: 'Your tool returns to standard positioning in listings. The demo video is removed from the public page, and the boosted badge is no longer shown.',
  },
  {
    q: 'How quickly does the boost take effect?',
    a: 'Within minutes of payment. If it has not appeared after an hour, email us with the tool name and we will sort it out by hand — and find out why.',
  },
];

const comparison = [
  { feature: 'Position in listings', standard: 'By date added', boosted: 'First, full-width' },
  { feature: 'Boosted section on the homepage', standard: false, boosted: true },
  { feature: 'Demo video on your page', standard: false, boosted: true },
  { feature: 'Boosted badge', standard: false, boosted: true },
  { feature: 'Search results', standard: 'By date added', boosted: 'First' },
  { feature: 'Trending', standard: 'Earned by real traffic', boosted: 'Earned by real traffic' },
];

export function PricingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userTools, setUserTools] = useState<Tool[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [toolsLoading, setToolsLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const product = STRIPE_PRODUCTS[0];

  const faqJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }), []);

  useSEO({
    title: 'Boost Your Tool',
    description: 'Give your tool maximum visibility on ToolsNoCode. Priority positioning, featured placement, demo videos, and more.',
    url: '/pricing',
    jsonLd: faqJsonLd,
  });

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setToolsLoading(true);

      const [toolsResult, subResult] = await Promise.all([
        supabase
          .from('tools')
          .select('id, name, slug, logo_url, is_boosted')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .maybeSingle(),
      ]);

      if (toolsResult.data) {
        setUserTools(toolsResult.data as Tool[]);
        const preselected = searchParams.get('tool');
        if (preselected) {
          const match = toolsResult.data.find((t: { id: string }) => t.id === preselected);
          if (match) setSelectedToolId(match.id);
        } else {
          const unboosted = toolsResult.data.find((t: { is_boosted?: boolean }) => !t.is_boosted);
          if (unboosted) setSelectedToolId(unboosted.id);
        }
      }

      setHasActiveSubscription(subResult.data?.subscription_status === 'active');
      setToolsLoading(false);
    };

    fetchUserData();
  }, [user, searchParams]);

  const selectedTool = userTools.find((t) => t.id === selectedToolId);
  const isAlreadyBoosted = selectedTool?.is_boosted;

  const handleSubscribe = async () => {
    if (!user || !selectedToolId) return;

    setLoading(true);
    setCheckoutError(null);
    try {
      const { url } = await createCheckoutSession(product.priceId, product.mode, selectedToolId);
      if (url) window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      console.error('Checkout error:', error);
      setCheckoutError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const renderBoostButton = (className: string) => {
    if (!user) {
      return (
        <Link to="/signup" className={`btn-primary ${className}`}>
          <Rocket className="w-4 h-4" />
          Get Started Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }

    if (userTools.length === 0 && !toolsLoading) {
      return (
        <Link to="/tools/new" className={`btn-primary ${className}`}>
          <Wrench className="w-4 h-4" />
          Submit Your Tool First
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }

    if (hasActiveSubscription) {
      return (
        <Link to="/account?tab=billing" className={`btn-primary ${className}`}>
          <Check className="w-4 h-4" />
          Manage Subscription
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }

    if (isAlreadyBoosted) {
      return (
        <button disabled className={`btn-primary opacity-50 cursor-not-allowed ${className}`}>
          <Check className="w-4 h-4" />
          Already Boosted
        </button>
      );
    }

    return (
      <>
        <button
          onClick={handleSubscribe}
          disabled={loading || !selectedToolId}
          className={`btn-primary ${className}`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><Rocket className="w-4 h-4" /> Boost My Tool — {formatPrice(product.price)}/yr</>
          )}
        </button>
        {checkoutError && (
          <p className="text-sm text-red-400 mt-2">{checkoutError}</p>
        )}
      </>
    );
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/8 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-brand-500/6 rounded-full blur-[140px]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <Rocket className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-sm text-brand-400 font-medium">For tool makers & founders</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
            Stand Out Among{' '}
            <span className="text-gradient">3,000+</span>{' '}
            Tools
          </h1>

          <p className="text-lg text-surface-400 leading-relaxed max-w-2xl mx-auto mb-8">
            A boosted tool is a <strong className="text-surface-200">full-width card</strong> at the top of the directory, of its category page, and of the homepage — not a badge on a tile.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <Eye className="w-4 h-4 text-brand-400" />
              <span><strong className="text-surface-200">Priority</strong> visibility</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <MousePointerClick className="w-4 h-4 text-emerald-400" />
              <span><strong className="text-surface-200">Full-width</strong> card</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span><strong className="text-surface-200">Boosted</strong> section on homepage</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <Shield className="w-4 h-4 text-sky-400" />
              <span><strong className="text-surface-200">Cancel</strong> anytime</span>
            </div>
          </div>

          {renderBoostButton('text-base px-8 py-3.5')}
          <p className="text-xs text-surface-600 mt-3">No contracts. Cancel anytime.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl font-bold text-white text-center mb-6">Standard vs Boosted</h2>
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider">
            <div className="px-5 py-3 text-surface-500">Feature</div>
            <div className="px-5 py-3 text-surface-500 text-center border-l border-surface-800/50">Standard</div>
            <div className="px-5 py-3 text-brand-400 text-center border-l border-brand-500/20 bg-brand-500/5">Boosted</div>
          </div>
          {comparison.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 border-t border-surface-800/50 ${i % 2 === 0 ? '' : 'bg-surface-900/30'}`}>
              <div className="px-5 py-3.5 text-sm text-surface-300">{row.feature}</div>
              <div className="px-5 py-3.5 text-sm text-surface-500 text-center border-l border-surface-800/50">
                {typeof row.standard === 'boolean' ? (
                  row.standard ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-surface-700">&mdash;</span>
                ) : row.standard}
              </div>
              <div className="px-5 py-3.5 text-sm text-center border-l border-brand-500/20 bg-brand-500/5">
                {typeof row.boosted === 'boolean' ? (
                  row.boosted ? <Check className="w-4 h-4 text-brand-400 mx-auto" /> : <span className="text-surface-700">&mdash;</span>
                ) : <span className="text-brand-400 font-medium">{row.boosted}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="glass-card p-5 group hover:border-surface-700/60 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center mb-4`}>
                  <b.icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-surface-200 mb-1.5">{b.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <div className="glass-card overflow-hidden ring-1 ring-brand-500/20">
              <div className="bg-gradient-to-r from-brand-500/15 to-emerald-500/10 border-b border-surface-800/50 px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-400" />
                    <span className="font-semibold text-white">{product.name}</span>
                  </div>
                  {product.highlight && (
                    <span className="badge-green text-xs">{product.highlight}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{formatPrice(product.price)}</span>
                  <span className="text-surface-400">/year</span>
                </div>
                <p className="text-xs text-surface-500 mt-1.5">
                  That's {formatPrice(product.price / 12)}/month
                </p>
              </div>

              <div className="p-6">
                {user && userTools.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-surface-400 mb-2">Select tool to boost</label>
                    <select
                      value={selectedToolId}
                      onChange={(e) => setSelectedToolId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:border-brand-500/60 transition-colors"
                    >
                      <option value="">Choose a tool...</option>
                      {userTools.map((tool) => (
                        <option key={tool.id} value={tool.id} disabled={tool.is_boosted}>
                          {tool.name}{tool.is_boosted ? ' (already boosted)' : ''}
                        </option>
                      ))}
                    </select>
                    {isAlreadyBoosted && (
                      <p className="text-xs text-amber-400 mt-1.5">This tool is already boosted.</p>
                    )}
                  </div>
                )}

                <ul className="space-y-3 mb-6">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-brand-400" />
                      </div>
                      <span className="text-sm text-surface-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {renderBoostButton('w-full py-3.5 text-base')}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-surface-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Boost activates instantly after payment</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-surface-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Cancel anytime. No questions asked.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 glass-card p-5 border-surface-800/60">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-200 mb-1">Don't have a listing yet?</p>
                  <p className="text-xs text-surface-500 mb-3 leading-relaxed">
                    Submit your tool for free and reach thousands of AI & no-code builders.
                  </p>
                  <Link to="/tools/new" className="btn-secondary text-xs py-1.5 px-3">
                    Submit your tool free
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500/10 via-surface-900/60 to-emerald-500/10 border border-brand-500/25 p-8 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/8 via-transparent to-transparent" />
          <div className="relative">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3">One plan, one price</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Boost your tool for a year.
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
              First in the directory, first on your category page, a section of its own on the homepage, and a demo video where it counts. Cancel whenever you like.
            </p>
            {renderBoostButton('px-8 py-3')}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm font-semibold text-surface-200">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-surface-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 border-t border-surface-800/50 pt-4">
                  <p className="text-sm text-surface-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="glass-card p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-500/5" />
          <div className="relative">
            <Rocket className="w-10 h-10 text-brand-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to get more users?
            </h2>
            <p className="text-surface-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              {formatPrice(product.price)} a year, billed once. Cancel anytime; the boost runs to the end of the period you paid for.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {renderBoostButton('px-8 py-3')}
              <Link to="/tools" className="btn-secondary px-8 py-3">
                <Search className="w-4 h-4" />
                Browse Tools
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
