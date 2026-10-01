package com.mcchama.mscompanion;

import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.view.Display;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Handler;
import android.os.HandlerThread;

import java.nio.ByteBuffer;

/**
 * Mirrors the screen into memory so the web app can read the game's menus (live sync). The
 * mirror is scaled down to {@link #WIDTH} pixels wide — enough to tell icons and level dots
 * apart, a fraction of the full screen to copy. Frames stay on the phone: the only reader is
 * the app's own WebView, through {@link WebAssetClient}.
 *
 * The newest frame is kept open rather than copied as it arrives; it is only copied out when
 * the web app actually asks for it. And it is hardly ever asked for: {@link #showsTheRun} tells
 * the run from a menu by looking at three pixels right here, so while the player is simply
 * playing — nearly all the time — no frame is copied at all.
 */
final class ScreenCapture implements WebAssetClient.FrameSource {
    /** Checked against real screenshots at this width (`npm run check:capture`). */
    private static final int WIDTH = 720;

    private final Object lock = new Object();
    private MediaProjection projection;
    private VirtualDisplay display;
    private ImageReader reader;
    private HandlerThread thread;
    private Image newest;
    private boolean unread;
    private int width;
    private int height;
    private int framesServed;
    /** Low-power capture: the mirror is switched off between readings (see {@link #requestFrame}). */
    private boolean economy;
    private boolean mirroring;
    private Handler mainHandler;

    /** How many frames the web app has been handed — 0 while "running" means the mirror delivers nothing. */
    int framesServed() {
        return framesServed;
    }

    boolean isRunning() {
        return projection != null;
    }

    /**
     * Starts mirroring with the consent the user just gave ({@code resultCode}/{@code data}
     * from Android's capture prompt). The caller must already be a foreground service of the
     * mediaProjection type. {@code onStopped} runs if Android ends the capture on its own.
     */
    void start(Context context, int resultCode, Intent data, Handler main, Runnable onStopped) {
        if (projection != null) return;
        mainHandler = main;
        MediaProjection granted = context.getSystemService(MediaProjectionManager.class).getMediaProjection(resultCode, data);
        if (granted == null) return;
        projection = granted;
        projection.registerCallback(new MediaProjection.Callback() {
            @Override
            public void onStop() {
                if (projection == null) return; // our own stop(), not Android ending the capture
                stop();
                onStopped.run();
            }
        }, main);

        Point size = new Point();
        context.getSystemService(DisplayManager.class).getDisplay(Display.DEFAULT_DISPLAY).getRealSize(size);
        // The game is portrait: mirror in portrait whatever way the phone is held right now.
        int shortSide = Math.min(size.x, size.y);
        int longSide = Math.max(size.x, size.y);
        width = WIDTH;
        height = Math.round(WIDTH * (float) longSide / shortSide);

        thread = new HandlerThread("screen-capture");
        thread.start();
        // 3 = the frame held open + the two acquireLatestImage needs to pick the newest.
        reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 3);
        reader.setOnImageAvailableListener(source -> {
            Image image;
            try {
                image = source.acquireLatestImage();
            } catch (IllegalStateException closed) {
                return;
            }
            if (image == null) return;
            synchronized (lock) {
                if (newest != null) newest.close();
                newest = image;
                unread = true;
            }
            // One frame was all that was asked for: stop mirroring until the next request.
            if (economy) mainHandler.post(this::pauseMirror);
        }, new Handler(thread.getLooper()));

        display = projection.createVirtualDisplay("ms-companion", width, height,
                context.getResources().getDisplayMetrics().densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, null);
        mirroring = true;
    }

    /**
     * Low-power capture (optional, experimental): the system normally draws every frame of the game
     * a second time for this mirror, although a reading only needs four a second. With it on, the
     * mirror has no surface to draw to except for the moment after {@link #requestFrame} — so the
     * extra drawing drops from every frame to a handful a second. The price is that a reading sees
     * a frame up to one tick old.
     */
    void setEconomy(boolean on) {
        economy = on;
        if (!on) resumeMirror();
    }

    /** With low-power capture on, lets the mirror draw one more frame; it switches itself back off once that frame is in. */
    void requestFrame() {
        if (economy) resumeMirror();
    }

    private void resumeMirror() {
        if (display == null || mirroring) return;
        display.setSurface(reader.getSurface());
        mirroring = true;
    }

    private void pauseMirror() {
        if (display == null || !mirroring || !economy) return;
        display.setSurface(null);
        mirroring = false;
    }

    /**
     * Whether the newest frame shows the run itself rather than a menu: the two white bars of the
     * pause button, top right, are lit (any menu dims them) with the top bar's brown between them.
     * The same test as {@code isGameplay} in src/capture/recognize.ts (positions on the 1080x2460
     * reference screen) — the two must stay in step.
     */
    boolean showsTheRun() {
        synchronized (lock) {
            if (newest == null) return false;
            Image.Plane plane = newest.getPlanes()[0];
            ByteBuffer pixels = plane.getBuffer();
            int rowStride = plane.getRowStride();
            return peak(pixels, rowStride, 1000, 78) >= 190 && peak(pixels, rowStride, 1024, 78) >= 190
                    && peak(pixels, rowStride, 1010, 70) < 170;
        }
    }

    /** The brightest channel of the pixel at a reference-screen position. */
    private int peak(ByteBuffer pixels, int rowStride, int refX, int refY) {
        int x = Math.round(refX * width / 1080f);
        int y = Math.round(refY * height / 2460f);
        int at = y * rowStride + x * 4;
        return Math.max(pixels.get(at) & 0xff, Math.max(pixels.get(at + 1) & 0xff, pixels.get(at + 2) & 0xff));
    }

    void stop() {
        MediaProjection ending = projection;
        projection = null;
        mirroring = false;
        if (display != null) display.release();
        display = null;
        if (reader != null) reader.close();
        reader = null;
        synchronized (lock) {
            if (newest != null) newest.close();
            newest = null;
            unread = false;
            framesServed = 0;
        }
        if (thread != null) thread.quitSafely();
        thread = null;
        if (ending != null) ending.stop();
    }

    @Override
    public byte[] takeFrame() {
        synchronized (lock) {
            if (newest == null || !unread) return null;
            unread = false;
            framesServed++;
            return copyNewest();
        }
    }

    /** The current frame whether or not it was already read (the "save what live sync sees" debug export). */
    byte[] peekFrame() {
        synchronized (lock) {
            return newest == null ? null : copyNewest();
        }
    }

    /** Caller holds {@link #lock} and has checked {@code newest}. */
    private byte[] copyNewest() {
        Image.Plane plane = newest.getPlanes()[0];
        ByteBuffer pixels = plane.getBuffer().duplicate();
        int rowStride = plane.getRowStride();
        int rowBytes = width * 4;
        byte[] out = new byte[8 + rowBytes * height];
        writeInt(out, 0, width);
        writeInt(out, 4, height);
        for (int row = 0; row < height; row++) {
            pixels.position(row * rowStride);
            pixels.get(out, 8 + row * rowBytes, rowBytes);
        }
        return out;
    }

    private static void writeInt(byte[] out, int offset, int value) {
        out[offset] = (byte) value;
        out[offset + 1] = (byte) (value >> 8);
        out[offset + 2] = (byte) (value >> 16);
        out[offset + 3] = (byte) (value >> 24);
    }
}
