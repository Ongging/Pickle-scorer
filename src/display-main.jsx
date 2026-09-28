import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { DisplayView } from './components/DisplayView';
import { openDisplayChannel } from './lib/liveDisplay';

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

    // The controlling window broadcasts on every state change, which is
    // frequent during a live game — but if it's closed or the tab is
    // backgrounded for a while, say so instead of silently going stale.
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
