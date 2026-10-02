import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { hasScenePanel, themeVars } from '../lib/themes';

export function HistoryScreen({ history, theme, onBack, onToggleFavorite, onDelete, onDeleteAll }) {
  const [confirmingAll, setConfirmingAll] = useState(false);
  const hasScene = hasScenePanel(theme);
  const themed = (sceneClasses, defaultClasses) => (hasScene ? sceneClasses : defaultClasses);

  useEffect(() => {
    if (!confirmingAll) return;
    const t = setTimeout(() => setConfirmingAll(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingAll]);

  return (
    <div
      style={themeVars(theme)}
      className={`h-full flex flex-col ${themed('bg-[var(--t-surface)] text-[var(--t-text)]', 'bg-ink-50 dark:bg-ink-950 text-ink-950 dark:text-ink-50')}`}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <button onClick={onBack} className={`p-2 -ml-2 rounded-full ${themed('bg-[var(--t-surface-alt)]', 'bg-ink-100 dark:bg-ink-800')}`}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display font-semibold">Game history</h2>
        <button
          onClick={() => (confirmingAll ? onDeleteAll() : setConfirmingAll(true))}
          className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
            confirmingAll ? 'bg-clay-600 text-white' : themed('bg-[var(--t-surface-alt)] text-[var(--t-text-muted)]', 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400')
          }`}
          disabled={history.length === 0}
        >
          {confirmingAll ? 'Tap to confirm' : 'Delete all'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className={`px-5 py-16 text-center text-sm ${themed('text-[var(--t-text-muted)]', 'text-ink-400 dark:text-ink-500')}`}>
            No games saved yet. Finished games show up here.
          </div>
        ) : (
          <div className="px-5 space-y-2 pb-10">
            {history.map((g) => (
              <div
                key={g.id}
                className={`rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm ${themed('bg-[var(--t-surface-alt)]', 'bg-white dark:bg-ink-900')}`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] ${themed('text-[var(--t-text-muted)]', 'text-ink-400 dark:text-ink-500')}`}>
                    {g.type}, {g.mode}, {new Date(g.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {g.teamA.name} {g.teamA.score} – {g.teamB.score} {g.teamB.name}
                  </div>
                  <div className={`text-xs ${themed('text-[var(--t-accent)]', 'text-court-600 dark:text-court-400')}`}>
                    {g.winner === 'A' ? g.teamA.name : g.teamB.name} won
                  </div>
                </div>
                <button onClick={() => onToggleFavorite(g.id)} className="p-1.5">
                  <Star size={18} className={g.favorite ? 'fill-amber-400 text-amber-400' : themed('text-[var(--t-text-muted)]', 'text-ink-300 dark:text-ink-600')} />
                </button>
                <button onClick={() => onDelete(g.id)} className={`p-1.5 ${themed('text-[var(--t-text-muted)]', 'text-ink-400 dark:text-ink-600')}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
