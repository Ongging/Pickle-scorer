import { useState, useEffect, useCallback, useRef } from 'react';
import { createGame, gameReducer } from './engine/rulesEngine';
import { storage } from './lib/storage';
import { useAuth } from './lib/auth';
import { useEntitlements } from './lib/entitlements';
import { openDisplayChannel, broadcastGameState, HEARTBEAT_MS } from './lib/liveDisplay';
import { SetupScreen } from './components/SetupScreen';
import { ScoreboardScreen } from './components/ScoreboardScreen';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryScreen } from './components/HistoryScreen';
import { AppShell } from './components/AppShell';

const DEFAULT_SETTINGS = {
  theme: 'minimalist',
  colorMode: 'system',
  textSize: 'md',
  displayAnnounceSize: 'md', // the "score to say" text size on the external display window
  haptics: true,
  announcementFormat: 'traditional',
  showCasualTracker: true,
  voiceURI: null, // null = browser default voice
  keyBindings: {
    pointA: 'ArrowLeft',
    pointB: 'ArrowRight',
    fault: 'ArrowDown',
    undo: 'Backspace',
  },
};

export default function App() {
  useAuth();
  useEntitlements();

  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...storage.get('pb-settings', {}) }));
  const [history, setHistory] = useState(() => storage.get('pb-history', []) || []);
  const [screen, setScreen] = useState('setup');
  const [historyReturnScreen, setHistoryReturnScreen] = useState('setup');
  const [showSettings, setShowSettings] = useState(false);
  const [casualTrackerVisible, setCasualTrackerVisible] = useState(() => {
    const s = storage.get('pb-settings', {});
    return (s && s.showCasualTracker) ?? true;
  });
  const [invalidFlash, setInvalidFlash] = useState(null);
  const savedRef = useRef(false);

  const [setupConfig, setSetupConfig] = useState({
    type: 'doubles',
    mode: 'traditional',
    winningScore: 11,
    gamePointMustServe: true,
    teamAName: 'Team A',
    teamBName: 'Team B',
    firstServer: 'A',
  });

  const [gameState, setGameState] = useState(() => createGame(setupConfig));
  const dispatch = useCallback((action) => setGameState((prev) => gameReducer(prev, action)), []);

  // Live sync to a pop-out display window, if one is open. Harmless if
  // not — postMessage into a BroadcastChannel with no listeners is a
  // no-op. See src/lib/liveDisplay.js and src/components/DisplayView.jsx.
  const displayChannelRef = useRef(null);
  const latestRef = useRef({ gameState, settings });
  latestRef.current = { gameState, settings };

  useEffect(() => {
    const channel = openDisplayChannel();
    displayChannelRef.current = channel;
    if (!channel) return undefined;

    // A display window asking "what's the current state?" right after
    // it opens — answer immediately instead of making it wait for the
    // next point to be scored.
    const onMessage = (event) => {
      if (event.data?.type !== 'hello') return;
      broadcastGameState(channel, latestRef.current.gameState, latestRef.current.settings);
    };
    channel.addEventListener('message', onMessage);

    // Also re-broadcast on a fixed heartbeat regardless of whether
    // anything changed — a normal multi-second pause between rallies
    // shouldn't read as "disconnected" on the display end.
    const heartbeat = setInterval(() => {
      broadcastGameState(channel, latestRef.current.gameState, latestRef.current.settings);
    }, HEARTBEAT_MS);

    return () => {
      channel.removeEventListener('message', onMessage);
      clearInterval(heartbeat);
      channel.close();
    };
  }, []);
  useEffect(() => {
    broadcastGameState(displayChannelRef.current, gameState, settings);
  }, [gameState, settings]);

  const changeSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.set('pb-settings', next);
      return next;
    });
  }, []);

  const changeCasualTrackerVisible = useCallback((v) => {
    setCasualTrackerVisible(v);
    changeSettings({ showCasualTracker: v });
  }, [changeSettings]);

  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const isDark = settings.colorMode === 'system' ? systemDark : settings.colorMode === 'dark';

  const vibrate = useCallback((pattern) => {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }, [settings.haptics]);

  const onPoint = (team) => {
    if (gameState.gameOver) return;
    if (gameState.config.mode === 'traditional' && team !== gameState.servingTeam) {
      vibrate(200);
      setInvalidFlash(team);
      setTimeout(() => setInvalidFlash(null), 500);
      return;
    }
    dispatch({ type: 'POINT', team });
  };
  const onFault = () => dispatch({ type: 'FAULT' });
  const onUndo = () => dispatch({ type: 'UNDO' });
  const onReset = () => setGameState(createGame(gameState.config));

  const startGame = () => {
    setGameState(createGame({ ...setupConfig }));
    setScreen('play');
  };
  const onNewGame = () => setScreen('setup');

  useEffect(() => {
    if (gameState.gameOver && !savedRef.current) {
      savedRef.current = true;
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: gameState.config.type,
        mode: gameState.config.mode,
        teamA: gameState.teamA,
        teamB: gameState.teamB,
        winner: gameState.winner,
        favorite: false,
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        storage.set('pb-history', next);
        return next;
      });
    }
    if (!gameState.gameOver) savedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameOver]);

  const toggleFavorite = (id) => {
    setHistory((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g));
      storage.set('pb-history', next);
      return next;
    });
  };
  const deleteGame = (id) => {
    setHistory((prev) => {
      const next = prev.filter((g) => g.id !== id);
      storage.set('pb-history', next);
      return next;
    });
  };
  const deleteAllHistory = () => {
    setHistory([]);
    storage.set('pb-history', []);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <AppShell
        screen={screen}
        gameState={gameState}
        theme={settings.theme}
        showSettings={showSettings}
        onNewGame={onNewGame}
        onOpenHistory={() => { setHistoryReturnScreen(screen === 'history' ? historyReturnScreen : screen); setScreen('history'); }}
        onOpenSettings={() => setShowSettings(true)}
      >
        {screen === 'setup' && (
          <SetupScreen
            setupConfig={setupConfig}
            setSetupConfig={setSetupConfig}
            theme={settings.theme}
            onStart={startGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHistory={() => { setHistoryReturnScreen('setup'); setScreen('history'); }}
          />
        )}
        {screen === 'play' && (
          <ScoreboardScreen
            gameState={gameState}
            dispatch={dispatch}
            settings={settings}
            casualTrackerVisible={casualTrackerVisible}
            setCasualTrackerVisible={changeCasualTrackerVisible}
            invalidFlash={invalidFlash}
            onPoint={onPoint}
            onFault={onFault}
            onUndo={onUndo}
            onReset={onReset}
            onNewGame={onNewGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHistory={() => { setHistoryReturnScreen('play'); setScreen('history'); }}
          />
        )}
        {screen === 'history' && (
          <HistoryScreen
            history={history}
            theme={settings.theme}
            onBack={() => setScreen(historyReturnScreen)}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteGame}
            onDeleteAll={deleteAllHistory}
          />
        )}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onChange={changeSettings}
            onClose={() => setShowSettings(false)}
            casualTrackerVisible={casualTrackerVisible}
            setCasualTrackerVisible={changeCasualTrackerVisible}
          />
        )}
      </AppShell>
    </div>
  );
}
