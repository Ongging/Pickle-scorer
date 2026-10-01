import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { DisplayView } from './components/DisplayView';
import { openDisplayChannel, requestCurrentState } from './lib/liveDisplay';

function DisplayApp() {
  const [payload, setPayload] = useState(null);
  const [connected, setConnected] = useState(true);
  const lastMessageRef = useRef(0);

  useEffect(() => {
    lastMessageRef.current = Date.now();
    const channel = openDisplayChannel();
    if (!channel) return;
    const onMessage = (event) => {
      if (event.data?.type !== 'state') return;
      lastMessageRef.current = Date.now();
      setPayload(event.data);
      setConnected(true);
    };
    channel.addEventListener('message', onMessage);

    // Ask immediately for whatever the current state already is — don't
    // wait around for the next point to be scored. The controlling
    // window (App.jsx) answers 'hello' messages right away.
    requestCurrentState(channel);

    // The controlling window broadcasts on every state change AND on a
    // fixed heartbeat regardless of change (see liveDisplay.js) — so a
    // normal pause between rallies doesn't look like a dropped
    // connection. Only flag it after missing several heartbeats' worth
    // of silence, which means the tab/window really is gone.
    const staleCheck = setInterval(() => {
      if (Date.now() - lastMessageRef.current > 8000) setConnected(false);
    }, 2000);

    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
      clearInterval(staleCheck);
    };
  }, []);

  return (
    <DisplayView
      gameState={payload?.gameState}
      settings={payload?.settings}
      connected={connected}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DisplayApp />
  </StrictMode>,
);
