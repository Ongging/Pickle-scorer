package com.example.pickleballscorer;

import android.content.Context;
import android.hardware.display.DisplayManager;
import android.view.Display;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * EXTERNAL DISPLAY DETECTION (native side)
 * ---------------------------------------------------------------------
 * See android-plugin/README.md before wiring this in — it's written
 * but NOT built or tested: this sandbox can't reach the Android SDK /
 * Gradle tooling, so it's only been checked against the real Capacitor
 * Plugin base-class source (bundled in node_modules/@capacitor/android)
 * to make sure the method signatures are right. It needs a real build
 * with Android Studio and a real device (or one with an actual
 * cast/HDMI setup) to confirm it behaves as intended.
 *
 * What this sees: any Display beyond the device's own default one —
 * a wired/HDMI monitor, and most wireless-display ("extend") setups,
 * since Android represents those as real additional Display objects
 * via DisplayManager. What it does NOT see: simple screen mirroring
 * where Android duplicates the same framebuffer without creating a
 * second Display object — some OEM "Smart View"/cast implementations
 * work this way. That's a real platform limitation, not a bug in this
 * file.
 */
@CapacitorPlugin(name = "ExternalDisplay")
public class ExternalDisplayPlugin extends Plugin {
    private DisplayManager displayManager;
    private DisplayManager.DisplayListener listener;

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
    }
}
