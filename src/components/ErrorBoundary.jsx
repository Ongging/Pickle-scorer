import { Component } from 'react';

/**
 * Catches any rendering error below it and shows a recovery screen
 * instead of a blank white page. This is the app-level safety net —
 * without it, a single unexpected error anywhere in the component tree
 * takes down the entire UI with no way back short of reloading.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Swap this for real crash reporting (Sentry, etc.) when that's wired up.
    console.error('Pickleball Scorer crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleResetData = () => {
    try {
      localStorage.removeItem('pb-settings');
      localStorage.removeItem('pb-history');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-950 dark:text-ink-50 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-lg font-display font-semibold">Something went wrong</div>
        <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs">
          The app hit an unexpected error. Your saved games and settings are
          untouched — try continuing, or reset if it keeps happening.
        </p>
        <div className="flex gap-3">
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-court-600 text-white text-sm font-display font-medium"
          >
            Try again
          </button>
          <button
            onClick={this.handleResetData}
            className="px-4 py-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-sm font-display font-medium"
          >
            Reset saved data
          </button>
        </div>
      </div>
    );
  }
}
