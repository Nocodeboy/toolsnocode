import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UpvoteButtonProps {
  itemType: 'tools' | 'projects';
  itemId: string;
  initialCount: number;
  size?: 'sm' | 'md';
  /**
   * `tools.upvotes` trae valores sembrados (Canva 19.800) mientras que 3.015
   * herramientas están a cero, así que en los listados se oculta el número y
   * se deja solo la acción, que sí es real.
   */
  showCount?: boolean;
}

export default function UpvoteButton({ itemType, itemId, initialCount, size = 'md', showCount = true }: UpvoteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVoted(true);
      });
  }, [user, itemType, itemId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (loading) return;
    setLoading(true);

    if (voted) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId);
      if (!error) {
        setVoted(false);
        setCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from('votes')
        .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
      if (!error) {
        setVoted(true);
        setCount((c) => c + 1);
      }
    }
    setLoading(false);
  };

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={voted ? 'Remove upvote' : 'Upvote'}
      className={`
        inline-flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-all duration-200 font-medium
        disabled:opacity-60
        ${isSmall ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
        ${voted
          ? 'bg-brand-500/15 border-brand-500/30 text-brand-400 hover:bg-brand-500/25'
          : 'bg-surface-800/60 border-surface-700/50 text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/20'
        }
      `}
    >
      <ChevronUp className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform duration-200 ${voted ? 'scale-110' : ''}`} />
      {showCount && <span>{count}</span>}
    </button>
  );
}
