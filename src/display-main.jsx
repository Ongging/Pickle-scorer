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

    // Native Presentation bridge (see android-plugin/ExternalDisplayPlugin.java
    // and lib/externalDisplay.js's pushStateToNative): when this page is
    // loaded inside the native second window rather than a web pop-out,
    // state arrives by the native side calling this function directly via
    // evaluateJavascript, not through BroadcastChannel — whether
    // BroadcastChannel even spans two separate native WebView instances
    // is unconfirmed, so this doesn't depend on it either way. Defined
    // unconditionally; it's simply never called on the web path.
    window.__applyNativeState = (state) => {
      lastMessageRef.current = Date.now();
      setPayload({ gameState: state.gameState, settings: state.settings });
      setConnected(true);
    };

    const channel = openDisplayChannel();
    if (!channel) return () => { delete window.__applyNativeState; };
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
    // of silence, which means the tab/window really is gone. The native
    // bridge above keeps the same lastMessageRef current too, so this
    // check works the same way regardless of which path is live.
    const staleCheck = setInterval(() => {
      if (Date.now() - lastMessageRef.current > 8000) setConnected(false);
    }, 2000);

    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
      clearInterval(staleCheck);
      delete window.__applyNativeState;
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
