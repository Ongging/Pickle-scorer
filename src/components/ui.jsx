export function ScoreNumeral({ value, theme, sizeClass }) {
  if (theme === 'digital') {
    return (
      <span
        className={`font-led font-bold tabular-nums tracking-wider ${sizeClass}`}
        style={{ color: '#34d399', textShadow: '0 0 4px rgba(52,211,153,0.9), 0 0 18px rgba(52,211,153,0.55)' }}
      >
        {String(value).padStart(2, '0')}
      </span>
    );
  }
  if (theme === 'flip') {
    return (
      <span
        key={value}
        className={`pb-flip relative inline-block font-flip font-semibold tabular-nums ${sizeClass}`}
        style={{
          color: '#f5f0e6',
          background: 'linear-gradient(180deg, #232323 0%, #161616 100%)',
          padding: '0.02em 0.22em',
          borderRadius: '10px',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -3px 0 rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {String(value).padStart(2, '0')}
        <span
          className="absolute left-0 right-0 top-1/2 pointer-events-none"
          style={{ height: '1px', background: 'rgba(0,0,0,0.5)' }}
        />
      </span>
    );
  }
  return (
    <span className={`font-display font-bold tabular-nums ${sizeClass} text-ink-950 dark:text-white`}>
      {value}
    </span>
  );
}

export function SegButton({ active, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors ${
        active
          ? 'bg-court-600 text-white'
          : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300'
      } ${className}`}
    >
      {children}
    </button>
  );
}

// The live serve number, shown as an actual numeral rather than a dot —
// legible at a glance from across the court, and unambiguous to anyone
// reading over your shoulder ("that's serve 2", not "hm, two dots").
// optic-yellow is reserved for exactly this one job in the whole app.
export function ServeNumber({ active, className = '', style }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-display font-bold leading-none tabular-nums ${className}`}
      style={{ background: '#D6DE22', color: '#1C2408', ...style }}
    >
      {active}
    </span>
  );
}

export function ToggleRow({ label, description, checked, onChange }) {
  // Inline styles compute the on/off state directly from JS, with zero
  // dependency on the CSS build pipeline.
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800 last:border-b-0">
      <div className="pr-4">
        <div className="text-sm font-medium text-ink-950 dark:text-ink-50">{label}</div>
        {description && <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          flexShrink: 0,
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          position: 'relative',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          backgroundColor: checked ? '#0F6E68' : '#AAB9B6',
          transition: 'background-color 150ms ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            transition: 'left 150ms ease',
          }}
        />
      </button>
    </div>
  );
}
