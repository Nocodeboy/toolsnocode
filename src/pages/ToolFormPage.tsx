import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, ArrowLeft, Trash2, Plus, X, Rocket, TrendingUp, Star, ArrowRight, CheckCircle, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import ImageUploader from '../components/ui/ImageUploader';
import { parseVideoUrl } from '../lib/video';
import type { Category } from '../types';

export default function ToolFormPage() {
  const { slug } = useParams();

  useSEO({
    title: slug ? 'Edit Tool' : 'Submit a New Tool',
    description: 'Submit or edit a tool listing on ToolsNoCode.',
    url: slug ? `/tools/${slug}/edit` : '/tools/new',
    noindex: true,
  });
  const isEdit = Boolean(slug);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [toolId, setToolId] = useState('');
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(['']);
  const [isBoosted, setIsBoosted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    logo_url: '',
    category_id: '',
    pricing: 'free' as string,
    pricing_details: '',
    tags: '',
    difficulty_level: 'beginner' as string,
    video_url: '',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          navigate('/tools');
          return;
        }
        if (data.user_id !== user?.id) {
          navigate(`/tools/${slug}`);
          return;
        }
        setToolId(data.id);
        setIsBoosted(Boolean(data.is_boosted));
        setForm({
          name: data.name,
          tagline: data.tagline ?? '',
          description: data.description ?? '',
          website: data.website ?? '',
          logo_url: data.logo_url ?? '',
          category_id: data.category_id ?? '',
          pricing: data.pricing ?? 'free',
          pricing_details: data.pricing_details ?? '',
          tags: (data.tags ?? []).join(', '),
          difficulty_level: data.difficulty_level ?? 'beginner',
          video_url: data.video_url ?? '',
        });
        const urls: string[] = (data.screenshot_urls ?? []);
        setScreenshotUrls(urls.length > 0 ? urls : ['']);
        setLoading(false);
      });
  }, [slug, user, navigate]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const tagsArr = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const newSlug = generateSlug(form.name);
    const screenshots = screenshotUrls.map((u) => u.trim()).filter(Boolean);

    /**
     * La categoría deja de ser opcional, y el desplegable deja de tener una
     * primera opción elegible.
     *
     * "3D & AR/VR" es la segunda categoría con más altas de makers de todo el
     * directorio: 33 herramientas de 33 makers distintos. Casi ninguna es 3D —
     * hay estudios de tatuaje de Carolina del Norte, una plataforma de
     * telemedicina, copiadores de señales de Telegram y astrología védica. Lo
     * que tiene de especial esa categoría no es su temática: es que empieza por
     * un dígito, así que encabeza una lista ordenada por nombre. La primera
     * opción de un desplegable no es una opción, es el valor por defecto de
     * quien tiene prisa.
     *
     * Se nota ahora porque cada categoría tiene por fin una página con texto
     * propio: el copy de `/categories/three-d` habla de topología de malla
     * sobre una lista de estudios de tatuaje.
     */
    if (!form.category_id) {
      setError('Pick a category — it decides which page your tool appears on.');
      setSaving(false);
      return;
    }

    const trimmedVideo = form.video_url.trim();
    if (isEdit && isBoosted && trimmedVideo && !parseVideoUrl(trimmedVideo)) {
      setError('Demo video URL must be a valid YouTube, Vimeo, or Loom link.');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      slug: newSlug,
      tagline: form.tagline,
      description: form.description,
      website: form.website,
      logo_url: form.logo_url,
      screenshot_urls: screenshots,
      category_id: form.category_id,
      pricing: form.pricing,
      pricing_details: form.pricing_details,
      tags: tagsArr,
      difficulty_level: form.difficulty_level,
      user_id: user.id,
      ...(isEdit && isBoosted ? { video_url: trimmedVideo } : {}),
    };

    if (isEdit) {
      const { error: err } = await supabase
        .from('tools')
        .update(payload)
        .eq('id', toolId);
      if (err) { setError(err.message); setSaving(false); return; }
      setSaving(false);
      navigate(`/tools/${newSlug}`);
    } else {
      const { error: err } = await supabase.from('tools').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
      setSaving(false);
      setPublishedSlug(newSlug);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    setDeleting(true);
    await supabase.from('tools').delete().eq('id', toolId);
    navigate('/tools');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-8 bg-surface-800 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (publishedSlug) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24">
        <div className="glass-card p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Your tool has been published</h1>
          <p className="text-surface-400 mb-8">
            It's now live in the directory. Boost its visibility to get ahead of the competition.
          </p>

          <div className="glass-card p-6 mb-6 text-left relative overflow-hidden border-brand-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-emerald-500/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-brand-400" />
                <span className="text-sm font-semibold text-brand-400 uppercase tracking-wide">Boost Plan</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-3">Get ahead of your competition</h2>
              <ul className="space-y-2.5 mb-6">
                {[
                  { icon: TrendingUp, text: 'Appear first in every listing' },
                  { icon: Star, text: 'Highlighted "Boosted" badge on your card' },
                  { icon: Rocket, text: 'Featured in the homepage spotlight section' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-surface-300">
                    <div className="w-5 h-5 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-brand-400" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="btn-primary w-full justify-center">
                See Boost plans
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <Link
            to={`/tools/${publishedSlug}`}
            className="text-sm text-surface-500 hover:text-surface-300 transition-colors"
          >
            No thanks, view my tool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Tool' : 'New Tool'}
          </h1>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="e.g. ChatGPT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Tagline</label>
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="input-field" placeholder="Short description" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field resize-none" placeholder="Detailed description of the tool..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" placeholder="https://..." />
          </div>

          <ImageUploader
            value={form.logo_url}
            onChange={(url) => setForm({ ...form, logo_url: url })}
            folder="logos"
            label="Logo"
            hint="Square image recommended. Will be converted to WebP automatically."
            aspectRatio="square"
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-surface-300">Screenshots</label>
              <button
                type="button"
                onClick={() => setScreenshotUrls((prev) => [...prev, ''])}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add screenshot
              </button>
            </div>
            <div className="space-y-4">
              {screenshotUrls.map((url, i) => (
                <div key={i} className="relative">
                  <ImageUploader
                    value={url}
                    onChange={(newUrl) => {
                      const next = [...screenshotUrls];
                      next[i] = newUrl;
                      setScreenshotUrls(next);
                    }}
                    folder="screenshots"
                    label={`Screenshot ${i + 1}`}
                    aspectRatio="landscape"
                  />
                  {screenshotUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setScreenshotUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 p-1 text-surface-500 hover:text-rose-400 transition-colors"
                      title="Remove screenshot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="" disabled>Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Pricing</label>
              <select value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} className="input-field">
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Difficulty</label>
              <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} className="input-field">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Pricing Details</label>
            <input value={form.pricing_details} onChange={(e) => setForm({ ...form, pricing_details: e.target.value })} className="input-field" placeholder="e.g. From $20/mo" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="ai, chatbot, productivity" />
          </div>

          {isEdit && isBoosted && (
            <div className="p-4 rounded-xl bg-brand-500/[0.06] border border-brand-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-brand-400" />
                <label className="block text-sm font-semibold text-white">Demo video URL</label>
                <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">Boost perk</span>
              </div>
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                className="input-field"
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-surface-500 mt-1.5">YouTube, Vimeo, or Loom. Shown at the top of your tool page.</p>
            </div>
          )}

          {!isEdit && (
            <div className="p-4 rounded-xl bg-brand-500/8 border border-brand-500/20 flex items-start gap-3">
              <Rocket className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Boost your tool after publishing</p>
                <p className="text-xs text-surface-400 mt-0.5">With Boost you'll appear first in every listing and get a highlighted badge on your card.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Publish Tool'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
