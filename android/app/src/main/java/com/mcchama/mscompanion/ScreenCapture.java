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
 * the web app actually asks for it, so an idle capture costs next to nothing.
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
        }, new Handler(thread.getLooper()));

        display = projection.createVirtualDisplay("ms-companion", width, height,
                context.getResources().getDisplayMetrics().densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, null);
    }

    void stop() {
        MediaProjection ending = projection;
        projection = null;
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
