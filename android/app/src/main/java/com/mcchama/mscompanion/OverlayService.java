package com.mcchama.mscompanion;

import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.PorterDuff;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.ContextThemeWrapper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;

import java.io.IOException;
import java.io.InputStream;

/**
 * Draws the companion over the game as two overlay windows: a small draggable bubble (always
 * there, never takes focus, so the game keeps every touch outside it) and, while open, a
 * full-screen panel holding the web app in a WebView. The panel is focusable so the web app's
 * number inputs get the keyboard. The WebView is created with the service and kept for its whole
 * life, so the app's in-memory UI state survives closing the panel — and so it can run without
 * being shown at all, which is what live sync needs.
 *
 * Live sync (optional, {@link ScreenCapture}): while the game is what's on screen, the web app
 * is asked twice a second to read the captured frame; it reports back through {@link Host}.
 */
public class OverlayService extends Service {
    private static final String CHANNEL_ID = "companion";
    private static final String ACTION_STOP = "com.mcchama.mscompanion.STOP";
    static final String ACTION_START_CAPTURE = "com.mcchama.mscompanion.START_CAPTURE";
    static final String EXTRA_RESULT_CODE = "resultCode";
    static final String EXTRA_RESULT_DATA = "resultData";
    private static final String PREFS = "bubble";
    private static final int BUBBLE_DP = 56;
    private static final long TICK_MS = 500;
    private static final long PICK_TIMEOUT_MS = 15000;

    private WindowManager windowManager;
    private ImageView bubble;
    private WindowManager.LayoutParams bubbleParams;
    private View panel;
    private WebView webView;
    private boolean panelOpen;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ScreenCapture capture = new ScreenCapture();
    private View pickStrip;
    private final Runnable dismissPick = this::removePickStrip;
    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!capture.isRunning()) return;
            // Our own panel on screen would be read as if it were the game (it looks like it on purpose).
            if (!panelOpen) webView.evaluateJavascript("window.__msCapture&&window.__msCapture.tick()", null);
            main.postDelayed(this, TICK_MS);
        }
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = getSystemService(WindowManager.class);
        startInForeground(false);
        panel = buildPanel();
        addBubble();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null && ACTION_START_CAPTURE.equals(intent.getAction())) startCapture(intent);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        main.removeCallbacksAndMessages(null);
        capture.stop();
        removePickStrip();
        if (panelOpen) windowManager.removeView(panel);
        if (bubble != null) windowManager.removeView(bubble);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    // --- Foreground notification (keeps the overlay alive behind the game) ---

    private void startInForeground(boolean capturing) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(new NotificationChannel(
                CHANNEL_ID, getString(R.string.notification_channel), NotificationManager.IMPORTANCE_MIN));

        PendingIntent stop = PendingIntent.getService(this, 0,
                new Intent(this, OverlayService.class).setAction(ACTION_STOP),
                PendingIntent.FLAG_IMMUTABLE);
        PendingIntent open = PendingIntent.getActivity(this, 0,
                new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new Notification.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.bubble_glyph)
                .setContentTitle(getString(R.string.notification_title))
                .setContentText(getString(R.string.notification_text))
                .setContentIntent(open)
                .addAction(new Notification.Action.Builder(null, getString(R.string.notification_stop), stop).build())
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT >= 34) {
            // Android 14 only accepts the mediaProjection type once the capture prompt was answered.
            int types = ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE;
            if (capturing) types |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION;
            startForeground(1, notification, types);
        } else {
            startForeground(1, notification);
        }
    }

    // --- Live sync ---

    @SuppressWarnings("deprecation")
    private void startCapture(Intent intent) {
        Intent data = intent.getParcelableExtra(EXTRA_RESULT_DATA);
        if (data == null || capture.isRunning()) return;
        try {
            startInForeground(true);
            capture.start(this, intent.getIntExtra(EXTRA_RESULT_CODE, 0), data, main, () -> startInForeground(false));
        } catch (SecurityException refused) {
            // The consent was already used or withdrawn: carry on as the plain bubble.
            startInForeground(false);
            return;
        }
        main.removeCallbacks(tick);
        main.postDelayed(tick, TICK_MS);
    }

    /** What the web app calls back into (window.MSCompanionHost — see src/capture/bridge.ts). */
    private final class Host {
        @JavascriptInterface
        public void toast(String text) {
            main.post(() -> Toast.makeText(OverlayService.this, text, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void askPick(String prompt, String optionsJson) {
            main.post(() -> showPickStrip(prompt, optionsJson));
        }
    }

    /**
     * A level-up's plain rows close without showing which one was tapped, so the web app asks:
     * the offered icons as small chips, plus a "none" chip. It sits on the game's own top bar —
     * the one strip of screen neither the game's controls nor the screen reading use.
     */
    private void showPickStrip(String prompt, String optionsJson) {
        removePickStrip();
        LinearLayout strip = new LinearLayout(this);
        strip.setOrientation(LinearLayout.HORIZONTAL);
        strip.setContentDescription(prompt);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.parseColor("#E6141418"));
        background.setCornerRadius(dp(8));
        strip.setBackground(background);
        int chip = dp(34);
        int gap = dp(4);

        try {
            JSONArray options = new JSONArray(optionsJson);
            for (int i = 0; i < options.length(); i++) {
                final int index = i;
                ImageView icon = new ImageView(this);
                icon.setContentDescription(options.getJSONObject(i).optString("label"));
                Bitmap sprite = loadSprite(options.getJSONObject(i).optString("icon"));
                if (sprite != null) icon.setImageBitmap(sprite);
                // The game shows these icons flat white, whatever the sprite's own colors.
                icon.setColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN);
                icon.setOnClickListener(v -> {
                    removePickStrip();
                    webView.evaluateJavascript("window.__msCapture&&window.__msCapture.resolvePick(" + index + ")", null);
                });
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(chip, chip);
                params.setMargins(gap, gap, gap, gap);
                strip.addView(icon, params);
            }
        } catch (JSONException malformed) {
            return;
        }

        TextView none = new TextView(this);
        none.setText("×");
        none.setContentDescription(getString(R.string.pick_skip));
        none.setTextColor(Color.parseColor("#f0603c"));
        none.setTextSize(22);
        none.setGravity(Gravity.CENTER);
        none.setOnClickListener(v -> removePickStrip());
        strip.addView(none, new LinearLayout.LayoutParams(chip, chip));

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.START;
        if (Build.VERSION.SDK_INT >= 28) {
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        windowManager.addView(strip, params);
        pickStrip = strip;
        main.postDelayed(dismissPick, PICK_TIMEOUT_MS);
    }

    private void removePickStrip() {
        main.removeCallbacks(dismissPick);
        if (pickStrip != null) windowManager.removeView(pickStrip);
        pickStrip = null;
    }

    /** A sprite of the bundled web app, from the URL the web app itself uses for it. */
    private Bitmap loadSprite(String url) {
        int base = url.indexOf(WebAssetClient.BASE_PATH);
        if (base < 0) return null;
        try (InputStream stream = getAssets().open("web/" + url.substring(base + WebAssetClient.BASE_PATH.length()))) {
            return BitmapFactory.decodeStream(stream);
        } catch (IOException missing) {
            return null;
        }
    }

    // --- Bubble ---

    private void addBubble() {
        int size = dp(BUBBLE_DP);
        bubble = new ImageView(this);
        bubble.setImageResource(R.drawable.bubble_glyph);
        bubble.setScaleType(ImageView.ScaleType.FIT_CENTER);
        bubble.setPadding(dp(10), dp(10), dp(10), dp(10));
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(Color.parseColor("#E6141418"));
        circle.setStroke(dp(2), Color.parseColor("#efc84f"));
        bubble.setBackground(circle);

        bubbleParams = new WindowManager.LayoutParams(size, size,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        bubbleParams.gravity = Gravity.TOP | Gravity.START;
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        bubbleParams.x = prefs.getInt("x", 0);
        bubbleParams.y = prefs.getInt("y", dp(160));

        bubble.setOnTouchListener(new BubbleTouch());
        windowManager.addView(bubble, bubbleParams);
    }

    /** Drag to move, tap to open; on release it snaps to the nearer left/right edge (like the
     *  web app's own Magic Circle bubble), keeping the height it was dropped at. */
    private final class BubbleTouch implements View.OnTouchListener {
        private final int slop = ViewConfiguration.get(OverlayService.this).getScaledTouchSlop();
        private float downRawX, downRawY;
        private int startX, startY;
        private boolean dragging;

        @SuppressLint("ClickableViewAccessibility")
        @Override
        public boolean onTouch(View view, MotionEvent event) {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downRawX = event.getRawX();
                    downRawY = event.getRawY();
                    startX = bubbleParams.x;
                    startY = bubbleParams.y;
                    dragging = false;
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = event.getRawX() - downRawX;
                    float dy = event.getRawY() - downRawY;
                    if (!dragging && Math.hypot(dx, dy) > slop) dragging = true;
                    if (dragging) {
                        bubbleParams.x = startX + Math.round(dx);
                        bubbleParams.y = startY + Math.round(dy);
                        windowManager.updateViewLayout(bubble, bubbleParams);
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    if (dragging) snapToEdge();
                    else openPanel();
                    return true;
                default:
                    return false;
            }
        }
    }

    private void snapToEdge() {
        DisplayMetrics screen = getResources().getDisplayMetrics();
        int maxX = screen.widthPixels - bubbleParams.width;
        int maxY = screen.heightPixels - bubbleParams.height;
        int targetX = bubbleParams.x + bubbleParams.width / 2 < screen.widthPixels / 2 ? 0 : maxX;
        bubbleParams.y = Math.max(0, Math.min(bubbleParams.y, maxY));

        ValueAnimator animator = ValueAnimator.ofInt(bubbleParams.x, targetX);
        animator.setDuration(180);
        animator.addUpdateListener(a -> {
            if (bubble == null || !bubble.isAttachedToWindow()) return;
            bubbleParams.x = (int) a.getAnimatedValue();
            windowManager.updateViewLayout(bubble, bubbleParams);
        });
        animator.start();

        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                .putInt("x", targetX).putInt("y", bubbleParams.y).apply();
    }

    // --- Panel ---

    private void openPanel() {
        if (panelOpen) return;
        removePickStrip();
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        params.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        windowManager.addView(panel, params);
        bubble.setVisibility(View.GONE);
        panelOpen = true;
    }

    private void closePanel() {
        if (!panelOpen) return;
        windowManager.removeView(panel);
        bubble.setVisibility(View.VISIBLE);
        panelOpen = false;
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private View buildPanel() {
        // A themed context so WebView-owned widgets (text selection, date pickers) can inflate.
        ContextThemeWrapper themed = new ContextThemeWrapper(this, android.R.style.Theme_DeviceDefault_NoActionBar);

        LinearLayout root = new LinearLayout(themed) {
            @Override
            public boolean dispatchKeyEvent(KeyEvent event) {
                if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
                    if (event.getAction() == KeyEvent.ACTION_UP) closePanel();
                    return true;
                }
                return super.dispatchKeyEvent(event);
            }
        };
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#141418"));

        TextView close = new TextView(themed);
        close.setText("×  " + getString(R.string.close_panel));
        close.setTextColor(Color.WHITE);
        close.setTextSize(15);
        close.setGravity(Gravity.CENTER_VERTICAL | Gravity.END);
        close.setPadding(dp(16), 0, dp(16), 0);
        close.setBackgroundColor(Color.parseColor("#26262c"));
        close.setOnClickListener(v -> closePanel());
        root.addView(close, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(40)));

        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        webView = new WebView(themed);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        webView.setWebViewClient(new WebAssetClient(getAssets(), capture));
        // Only the bundled app ever loads here: the APK has no network permission at all.
        webView.addJavascriptInterface(new Host(), "MSCompanionHost");
        webView.setBackgroundColor(Color.parseColor("#141418"));
        webView.loadUrl(WebAssetClient.START_URL);

        FrameLayout webHolder = new FrameLayout(themed);
        webHolder.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(webHolder, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return root;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
