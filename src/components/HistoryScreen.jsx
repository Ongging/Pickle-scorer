import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';

export function HistoryScreen({ history, onBack, onToggleFavorite, onDelete, onDeleteAll }) {
  const [confirmingAll, setConfirmingAll] = useState(false);

  useEffect(() => {
    if (!confirmingAll) return;
    const t = setTimeout(() => setConfirmingAll(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingAll]);

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-semibold">Game history</h2>
        <button
          onClick={() => (confirmingAll ? onDeleteAll() : setConfirmingAll(true))}
          className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
            confirmingAll ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}
          disabled={history.length === 0}
        >
          {confirmingAll ? 'Tap to confirm' : 'Delete all'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No games saved yet. Finished games show up here.
          </div>
        ) : (
          <div className="px-5 space-y-2 pb-10">
            {history.map((g) => (
              <div key={g.id} className="bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {g.type} · {g.mode} · {new Date(g.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {g.teamA.name} {g.teamA.score} – {g.teamB.score} {g.teamB.name}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    {g.winner === 'A' ? g.teamA.name : g.teamB.name} won
                  </div>
                </div>
                <button onClick={() => onToggleFavorite(g.id)} className="p-1.5">
                  <Star size={18} className={g.favorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'} />
                </button>
                <button onClick={() => onDelete(g.id)} className="p-1.5 text-zinc-400 dark:text-zinc-600">
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
