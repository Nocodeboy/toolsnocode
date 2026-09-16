import { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  User, Wrench, Users, BookOpen, FolderOpen, ShieldCheck,
  Mail, Key, Loader2, CheckCircle2, AlertCircle, Clock,
  XCircle, ExternalLink, Pencil, ArrowRight, Plus, Rocket, Play, CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { openBillingPortal } from '../lib/stripe';

import type { Tool, Expert, Tutorial, Project, ClaimRequest } from '../types';
import ToolCard from '../components/ui/ToolCard';
import ExpertCard from '../components/ui/ExpertCard';
import TutorialCard from '../components/ui/TutorialCard';
import ProjectCard from '../components/ui/ProjectCard';
import VerifyToolButton from '../components/ui/VerifyToolButton';

type TabKey = 'profile' | 'tools' | 'experts' | 'tutorials' | 'projects' | 'claims' | 'billing';

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'tools', label: 'My Tools', icon: Wrench },
  { key: 'experts', label: 'My Experts', icon: Users },
  { key: 'tutorials', label: 'My Tutorials', icon: BookOpen },
  { key: 'projects', label: 'My Projects', icon: FolderOpen },
  { key: 'claims', label: 'Claim Requests', icon: ShieldCheck },
  { key: 'billing', label: 'Billing', icon: CreditCard },
];

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  // `/account?tab=billing` es a donde vuelve el portal de Stripe y a donde
  // manda "Manage Subscription" desde /pricing: la pestaña tiene que abrirse
  // desde la URL, no solo desde un clic.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabs.some((t) => t.key === requestedTab) ? (requestedTab as TabKey) : 'profile',
  );

  useSEO({
    title: 'My Account',
    description: 'Manage your ToolsNoCode account, tools, expert profiles, tutorials, and projects.',
    url: '/account',
    noindex: true,
  });

  const [tools, setTools] = useState<Tool[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchContent = async () => {
      setContentLoading(true);
      const [toolsRes, expertsRes, tutorialsRes, projectsRes, claimsRes] = await Promise.all([
        supabase.from('tools').select('*, categories(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('experts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tutorials').select('*, tools(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('projects').select('*, project_tools(tool_id, tools(*))').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('claim_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setTools(
        (toolsRes.data ?? []).map((t: Record<string, unknown>) => ({ ...t, category: t.categories })) as Tool[]
      );
      setExperts((expertsRes.data ?? []) as Expert[]);
      setTutorials(
        (tutorialsRes.data ?? []).map((t: Record<string, unknown>) => ({ ...t, tool: t.tools })) as Tutorial[]
      );
      setProjects(
        (projectsRes.data ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          tools: ((p.project_tools as { tools: Tool }[]) ?? []).map((pt) => pt.tools),
        })) as Project[]
      );
      setClaimRequests((claimsRes.data ?? []) as ClaimRequest[]);
      setContentLoading(false);
    };
    fetchContent();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const counts: Partial<Record<TabKey, number>> = {
    tools: tools.length,
    experts: experts.length,
    tutorials: tutorials.length,
    projects: projects.length,
    claims: claimRequests.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">My Account</h1>
            <p className="text-surface-400 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2 border-b border-surface-800/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs ${
                  isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-800 text-surface-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'billing' && <BillingTab boostedTools={tools.filter((t) => t.is_boosted)} />}
      {activeTab === 'tools' && (
        <ContentTab
          loading={contentLoading}
          items={tools}
          emptyLabel="tools"
          createHref="/tools/new"
          renderItem={(tool) => {
            const t = tool as Tool;
            return (
              <div key={t.id} className="flex flex-col gap-2">
                <div className="relative group">
                  <ToolCard tool={t} />
                  <Link
                    to={`/tools/${t.slug}/edit`}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-white transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {t.website && !t.is_verified && (
                  <VerifyToolButton
                    toolId={t.id}
                    toolName={t.name}
                    toolWebsite={t.website}
                    initialToken={t.verification_token}
                    initialVerified={t.is_verified ?? false}
                    onVerified={() => setTools((prev) =>
                      prev.map((x) => x.id === t.id ? { ...x, is_verified: true } : x)
                    )}
                  />
                )}
                {!t.is_boosted && (
                  <Link
                    to={`/pricing?tool=${t.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/8 border border-brand-500/20 hover:border-brand-500/40 transition-all text-xs group"
                  >
                    <Rocket className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-surface-300 font-medium">Boost this tool</span>
                    <ArrowRight className="w-3 h-3 text-brand-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
                {t.is_boosted && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/25 text-xs">
                      <Rocket className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-brand-400 font-medium">Boosted</span>
                      {t.boost_expires_at && (
                        <span className="text-surface-500 ml-auto">
                          until {new Date(t.boost_expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/tools/${t.slug}/edit`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-900/60 border border-surface-700/50 hover:border-brand-500/30 transition-all text-xs group"
                    >
                      <Play className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-surface-300 font-medium">{t.video_url ? 'Edit demo video' : 'Add demo video'}</span>
                      <ArrowRight className="w-3 h-3 text-brand-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </>
                )}
              </div>
            );
          }}
        />
      )}
      {activeTab === 'experts' && (
        <ContentTab
          loading={contentLoading}
          items={experts}
          emptyLabel="expert profiles"
          createHref="/experts/new"
          renderItem={(expert) => (
            <div key={(expert as Expert).id} className="relative group">
              <ExpertCard expert={expert as Expert} />
              <Link
                to={`/experts/${(expert as Expert).slug}/edit`}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-white transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        />
      )}
      {activeTab === 'tutorials' && (
        <ContentTab
          loading={contentLoading}
          items={tutorials}
          emptyLabel="tutorials"
          createHref="/tutorials/new"
          renderItem={(tutorial) => (
            <div key={(tutorial as Tutorial).id} className="relative group">
              <TutorialCard tutorial={tutorial as Tutorial} />
              <Link
                to={`/tutorials/${(tutorial as Tutorial).slug}/edit`}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-white transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        />
      )}
      {activeTab === 'projects' && (
        <ContentTab
          loading={contentLoading}
          items={projects}
          emptyLabel="projects"
          createHref="/projects/new"
          renderItem={(project) => (
            <div key={(project as Project).id} className="relative group">
              <ProjectCard project={project as Project} />
              <Link
                to={`/projects/${(project as Project).slug}/edit`}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-white transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        />
      )}
      {activeTab === 'claims' && (
        <ClaimsTab loading={contentLoading} requests={claimRequests} />
      )}
    </div>
  );
}

function ProfileTab({ user }: { user: { email?: string } }) {
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-400" />
          Account Details
        </h2>
        <div className="space-y-1">
          <p className="text-xs text-surface-500 font-medium">Email address</p>
          <p className="text-sm text-surface-200">{user.email}</p>
        </div>
        <p className="text-xs text-surface-600">To change your email address, please contact support.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-400" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/60 transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/60 transition-colors"
              required
            />
          </div>

          {pwError && (
            <div className="flex items-start gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Password updated successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="btn-primary text-sm w-full"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-3">Danger Zone</h2>
        <p className="text-xs text-surface-500 mb-4">Sign out of your account on this device.</p>
        <button
          onClick={signOut}
          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 text-sm font-medium transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

interface ContentTabProps {
  loading: boolean;
  items: unknown[];
  emptyLabel: string;
  createHref: string;
  renderItem: (item: unknown) => React.ReactNode;
}

function ContentTab({ loading, items, emptyLabel, createHref, renderItem }: ContentTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="h-32 bg-surface-800 rounded-xl mb-4" />
            <div className="h-4 bg-surface-800 rounded w-2/3 mb-2" />
            <div className="h-3 bg-surface-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <FolderOpen className="w-12 h-12 text-surface-700 mx-auto mb-4" />
        <p className="text-surface-400 mb-6">You haven't created any {emptyLabel} yet.</p>
        <Link to={createHref} className="btn-primary text-sm inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create your first
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Link to={createHref} className="btn-primary text-sm inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create new
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => renderItem(item))}
      </div>
    </div>
  );
}

function ClaimsTab({ loading, requests }: { loading: boolean; requests: ClaimRequest[] }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-800 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-800 rounded w-1/3" />
              <div className="h-3 bg-surface-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-surface-700 mx-auto mb-4" />
        <p className="text-surface-400 mb-2">No claim requests yet.</p>
        <p className="text-xs text-surface-600">
          Visit a tool or expert listing page and click "Claim this listing" to request ownership.
        </p>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'bg-amber-500/15 text-amber-300',
      label: 'Pending review',
    },
    approved: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'bg-emerald-500/15 text-emerald-300',
      label: 'Approved',
    },
    rejected: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      badge: 'bg-rose-500/15 text-rose-300',
      label: 'Rejected',
    },
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const cfg = statusConfig[req.status];
        return (
          <div key={req.id} className={`glass-card p-5 border ${cfg.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-surface-600 capitalize">{req.item_type.replace('s', '')} listing</span>
                  </div>
                  <p className="text-sm text-surface-300 line-clamp-2">{req.justification}</p>
                  {req.contact_proof && (
                    <a
                      href={req.contact_proof.startsWith('http') ? req.contact_proof : `https://${req.contact_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {req.contact_proof}
                    </a>
                  )}
                  {req.admin_note && req.status === 'rejected' && (
                    <p className="text-xs text-surface-500 mt-2 italic">Note: {req.admin_note}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-surface-600 shrink-0">
                {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface BillingRow {
  subscription_status: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

/**
 * Lo que un cliente de pago necesita ver y hacer sin escribir a nadie: qué ha
 * contratado, hasta cuándo, con qué tarjeta, qué herramienta está impulsada —
 * y un botón que abre el portal de Stripe para cancelar, cambiar la tarjeta o
 * bajarse la factura.
 */
function BillingTab({ boostedTools }: { boostedTools: Tool[] }) {
  const [row, setRow] = useState<BillingRow | null | undefined>(undefined);
  const [opening, setOpening] = useState(false);
  const [portalError, setPortalError] = useState('');

  useEffect(() => {
    supabase
      .from('stripe_user_subscriptions')
      .select('subscription_status, current_period_end, cancel_at_period_end, payment_method_brand, payment_method_last4')
      .maybeSingle()
      .then(({ data }) => setRow((data as BillingRow | null) ?? null));
  }, []);

  const openPortal = async () => {
    setOpening(true);
    setPortalError('');
    try {
      window.location.href = await openBillingPortal();
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Could not open the billing portal');
      setOpening(false);
    }
  };

  if (row === undefined) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;
  }

  const status = row?.subscription_status ?? null;
  const active = status === 'active' || status === 'trialing';
  const periodEnd = row?.current_period_end
    ? new Date(row.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  if (!row || !status || status === 'not_started') {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto">
        <CreditCard className="w-8 h-8 text-surface-500 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">No subscription yet</p>
        <p className="text-sm text-surface-500 mb-5">Boost one of your tools and your billing will show up here.</p>
        <Link to="/pricing" className="btn-primary text-sm inline-flex"><Rocket className="w-4 h-4" /> See Boost</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-surface-500 mb-1">Boost plan</p>
            <p className="text-lg font-semibold text-white capitalize">{status.replace('_', ' ')}</p>
          </div>
          <span className={`badge border ${active ? 'bg-brand-500/15 text-brand-400 border-brand-500/20' : 'bg-surface-800 text-surface-400 border-surface-700'}`}>
            {active ? 'Active' : status}
          </span>
        </div>

        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          {periodEnd && (
            <div>
              <dt className="text-surface-500 mb-0.5">{row.cancel_at_period_end ? 'Ends on' : 'Renews on'}</dt>
              <dd className="text-surface-200">{periodEnd}</dd>
            </div>
          )}
          {row.payment_method_last4 && (
            <div>
              <dt className="text-surface-500 mb-0.5">Payment method</dt>
              <dd className="text-surface-200 capitalize">{row.payment_method_brand} ···· {row.payment_method_last4}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-surface-500 mb-0.5">Boosted tool{boostedTools.length !== 1 ? 's' : ''}</dt>
            <dd className="text-surface-200">
              {boostedTools.length === 0
                ? <span className="text-amber-400">None yet — if you have paid, email us and we will sort it out.</span>
                : boostedTools.map((t) => (
                    <Link key={t.id} to={`/tools/${t.slug}`} className="text-brand-400 hover:text-brand-300 mr-3">{t.name}</Link>
                  ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openPortal} disabled={opening} className="btn-primary text-sm">
          {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Manage billing
        </button>
        <span className="text-xs text-surface-500">Cancel, change card, download invoices — on Stripe.</span>
      </div>
      {portalError && (
        <p className="text-sm text-rose-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {portalError}</p>
      )}
    </div>
  );
}
