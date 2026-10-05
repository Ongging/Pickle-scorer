package com.example.pickleballscorer;

import android.app.Presentation;
import android.content.Context;
import android.hardware.display.DisplayManager;
import android.os.Bundle;
import android.view.Display;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * EXTERNAL DISPLAY — detection AND the real thing (native side)
 * ---------------------------------------------------------------------
 * See android-plugin/README.md before wiring this in — it's written
 * but NOT built or tested: this sandbox can't reach the Android SDK /
 * Gradle tooling. Every API used below (Plugin.getBridge(),
 * Bridge.getLocalServer()/getScheme()/getHost()/executeOnMainThread(),
 * Presentation's lifecycle) was checked against Capacitor's actual
 * bundled source (node_modules/@capacitor/android) and Android's
 * documented Presentation API, not guessed — but "the right API calls,
 * reasoned carefully" is still a different thing from "run and seen
 * working." It needs a real build and a real external display (HDMI
 * adapter + monitor is the easiest to test with) to confirm.
 *
 * What this sees: any Display beyond the device's own default one —
 * a wired/HDMI monitor, and most wireless-display ("extend") setups,
 * since Android represents those as real additional Display objects
 * via DisplayManager. What it does NOT see: simple screen mirroring
 * where Android duplicates the same framebuffer without creating a
 * second Display object — some OEM "Smart View"/cast implementations
 * work this way. That's a real platform limitation, not a bug here.
 *
 * present(): finds that external Display and opens a REAL second
 * window on it via Android's Presentation API — a long-standing,
 * standard API built for exactly this (it predates and is unrelated to
 * "Smart View"-style mirroring). That second window hosts its own
 * WebView loading display.html, so the phone's own screen is completely
 * free to keep showing the normal scoreboard with controls — this is
 * the "real" dual-screen version Presentation Mode (ScoreboardScreen's
 * in-app fallback) can't give you on its own.
 *
 * The tricky part wasn't the Display/Presentation side, which Android
 * handles cleanly — it's that a manually-created WebView doesn't
 * automatically know how to load this app's own bundled files the way
 * the main one does. Rather than reimplementing that, this reuses the
 * main Capacitor bridge's own asset server (getBridge().getLocalServer())
 * for the second WebView's shouldInterceptRequest — so it serves the
 * exact same JS/CSS/fonts/themes as the main WebView, guaranteed to
 * match, nothing duplicated.
 *
 * State bridging: BroadcastChannel (the mechanism the web pop-out window
 * uses) is NOT relied on here — whether it spans two separate native
 * WebView instances is genuinely unclear without testing, so this uses
 * something guaranteed to work instead: the JS side calls updateState()
 * on every change (same moments it already posts to BroadcastChannel —
 * see lib/externalDisplay.js's pushStateToNative), which lands here as
 * a JSON string and gets injected directly into the presented WebView
 * via evaluateJavascript(), calling a small hook
 * (window.__applyNativeState) that display-main.jsx defines specifically
 * for this.
 */
@CapacitorPlugin(name = "ExternalDisplay")
public class ExternalDisplayPlugin extends Plugin {
    private DisplayManager displayManager;
    private DisplayManager.DisplayListener listener;
    private ScorePresentation activePresentation;

    @Override
    public void load() {
        displayManager = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        listener = new DisplayManager.DisplayListener() {
            @Override
            public void onDisplayAdded(int displayId) {
                notifyState();
            }

            @Override
            public void onDisplayRemoved(int displayId) {
                notifyState();
                // Not responsible for dismissing activePresentation here —
                // Android calls ScorePresentation.onDisplayRemoved() below
                // directly (and auto-dismisses it) when its own target
                // Display goes away, which is the more reliable hook since
                // it's tied to the exact Presentation instance rather than
                // a displayId comparison here.
            }

            @Override
            public void onDisplayChanged(int displayId) {
                // Resolution/orientation change on an existing display —
                // not a connect/disconnect, so nothing to report.
            }
        };
        displayManager.registerDisplayListener(listener, null);
    }

    /** Lets the JS side ask the current state directly, not just listen for changes. */
    @PluginMethod
    public void isConnected(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("connected", hasExternalDisplay());
        call.resolve(ret);
    }

    /** Opens the real second window on the external display. Rejects if
     * there isn't one connected right now — the JS side falls back to
     * in-app Presentation Mode when this rejects (see ScoreboardScreen). */
    @PluginMethod
    public void present(PluginCall call) {
        Display target = null;
        for (Display d : displayManager.getDisplays()) {
            if (d.getDisplayId() != Display.DEFAULT_DISPLAY) {
                target = d;
                break;
            }
        }
        if (target == null) {
            call.reject("No external display connected");
            return;
        }
        final Display finalTarget = target;
        getBridge()
            .executeOnMainThread(() -> {
                if (activePresentation != null) {
                    activePresentation.dismiss();
                    activePresentation = null;
                }
                activePresentation = new ScorePresentation(getActivity(), finalTarget);
                activePresentation.show();
                call.resolve();
            });
    }

    /** Closes the second window, if one is open. Always resolves — closing
     * nothing isn't an error. */
    @PluginMethod
    public void dismiss(PluginCall call) {
        getBridge()
            .executeOnMainThread(() -> {
                if (activePresentation != null) {
                    activePresentation.dismiss();
                    activePresentation = null;
                }
                call.resolve();
            });
    }

    /** Pushes the latest game state into the presented WebView, if one is
     * currently showing. The JS side calls this on every change
     * regardless of whether present() has ever succeeded — harmless
     * no-op when nothing's being presented, so it doesn't need to track
     * presentation state itself. */
    @PluginMethod
    public void updateState(PluginCall call) {
        String json = call.getString("json");
        getBridge()
            .executeOnMainThread(() -> {
                if (activePresentation != null && json != null) {
                    activePresentation.applyState(json);
                }
                call.resolve();
            });
    }

    private boolean hasExternalDisplay() {
        for (Display d : displayManager.getDisplays()) {
            if (d.getDisplayId() != Display.DEFAULT_DISPLAY) return true;
        }
        return false;
    }

    private void notifyState() {
        JSObject data = new JSObject();
        data.put("connected", hasExternalDisplay());
        notifyListeners("externalDisplayChanged", data);
    }

    @Override
    protected void handleOnDestroy() {
        if (displayManager != null && listener != null) {
            displayManager.unregisterDisplayListener(listener);
        }
        if (activePresentation != null) {
            activePresentation.dismiss();
            activePresentation = null;
        }
    }

    /** The actual second window. Inner (non-static) class on purpose —
     * it needs getBridge()/getActivity() from the outer plugin, and
     * clears ExternalDisplayPlugin.this.activePresentation when Android
     * auto-dismisses it (external display unplugged). */
    private class ScorePresentation extends Presentation {
        private WebView webView;

        ScorePresentation(Context outerContext, Display display) {
            super(outerContext, display);
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            webView = new WebView(getContext());
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.setWebViewClient(
                new WebViewClient() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        // Reuse the main bridge's own asset server — see
                        // the class-level comment for why.
                        return getBridge().getLocalServer().shouldInterceptRequest(request);
                    }
                }
            );
            setContentView(
                webView,
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            );
            String url = getBridge().getScheme() + "://" + getBridge().getHost() + "/display.html";
            webView.loadUrl(url);
        }

        /** Runs window.__applyNativeState(<state>) inside this
         * Presentation's WebView. `json` is already a JSON string (from
         * JSON.stringify on the JS side), so it's injected as a literal
         * object expression, not a string argument — the function on
         * the other end receives a real object, no JSON.parse needed
         * there either. Must be called from the main thread (all three
         * @PluginMethods above already guarantee that via
         * executeOnMainThread). */
        void applyState(String json) {
            if (webView == null) return;
            webView.evaluateJavascript("window.__applyNativeState && window.__applyNativeState(" + json + ")", null);
        }

        @Override
        public void onDisplayRemoved() {
            super.onDisplayRemoved(); // Android auto-dismisses after this
            if (ExternalDisplayPlugin.this.activePresentation == this) {
                ExternalDisplayPlugin.this.activePresentation = null;
            }
        }
    }
}
