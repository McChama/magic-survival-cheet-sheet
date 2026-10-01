package com.mcchama.mscompanion;

import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.PorterDuff;
import android.graphics.drawable.GradientDrawable;
import android.hardware.display.DisplayManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.view.ContextThemeWrapper;
import android.view.Display;
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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

/**
 * Draws the companion over the game as overlay windows: a small draggable bubble (always there,
 * never takes focus, so the game keeps every touch outside it) and a full-screen panel holding
 * the web app in a WebView. The panel is never removed: while "closed" it is parked just off
 * the screen's edge, invisible and untouchable, so the WebView stays attached and running —
 * live sync needs the web app alive while the game is what's on screen — and keeps its
 * in-memory UI state. Open, it is focusable so the web app's number inputs get the keyboard.
 *
 * Live sync (optional, {@link ScreenCapture}): while the panel is parked, the web app is asked
 * twice a second to read the captured frame; it reports back through {@link Host}. The bubble's
 * ring shows whether that loop is alive (green), broken (red) or off (gold), and the panel's
 * header says what the reader last saw. During a choice the whole bubble — ring and icon —
 * says where it stands: the Owned Magic icon for a level-up (once the tap guards are up) and for
 * Enchant's grid of magics, or the Owned Artifact icon for a chest, white while nothing is selected
 * and gold once something is and only the confirming tap is missing.
 */
public class OverlayService extends Service {
    private static final String CHANNEL_ID = "companion";
    private static final String ACTION_STOP = "com.mcchama.mscompanion.STOP";
    static final String ACTION_START_CAPTURE = "com.mcchama.mscompanion.START_CAPTURE";
    static final String EXTRA_RESULT_CODE = "resultCode";
    static final String EXTRA_RESULT_DATA = "resultData";
    static final String EXTRA_ECONOMY = "economy";
    private static final String PREFS = "bubble";
    private static final int BUBBLE_DP = 56;
    /**
     * How often the screen is looked at. Whether the run is still up costs three pixels, so that is checked
     * all the time — it is what makes a level-up noticed (and its taps guarded) as it appears. A menu is read
     * often while it is up, and when nothing readable is on screen (the game's main menu) hardly at all.
     */
    private static final long TICK_PLAYING_MS = 60;
    private static final long TICK_MENU_MS = 60;
    private static final long TICK_IDLE_MS = 1000;
    /** Low-power capture mirrors one frame per tick, so there the tick itself is what is kept slow. */
    private static final long TICK_ECONOMY_MS = 250;
    /** While the run is up the header and ring are only brought up to date this often (in ticks). */
    private static final int STEADY_REFRESH_EVERY = 16;
    /** Tap guards vanish on their own this long after the web app last asked for them — they must never outlive the screen they cover. */
    private static final long GUARD_KEEPALIVE_MS = 1500;
    private static final int GUARD_FLAGS = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
    private static final long PICK_TIMEOUT_MS = 15000;
    private static final long NOTICE_MS = 2500;
    /** No word from the web app for this long while capturing = the reader is not working. */
    private static final long SILENT_MS = 3000;
    private static final long LONG_PRESS_MS = 700;

    private static final int RING_OFF = Color.parseColor("#efc84f");
    private static final int RING_ALIVE = Color.parseColor("#3fdc5a");
    private static final int RING_BROKEN = Color.parseColor("#f0603c");
    /** A choice is on screen and nothing is selected yet. */
    private static final int RING_READY = Color.WHITE;
    /** Something is selected and only the confirming tap is missing — the gold of the game's own "_Gold" icons. */
    private static final int RING_PENDING = Color.parseColor("#efc84f");

    /**
     * What the bubble shows during a choice, instead of its own heptagram: the icon of the Dashboard button the
     * choice belongs to — Owned Magic for a level-up, Owned Artifact for a chest — in the game's white sprite
     * while nothing is selected and its gold one once something is. The sprites are the web app's (assets/web).
     */
    private static final int LOOK_DEFAULT = 0;
    private static final int LOOK_MAGIC = 1;
    private static final int LOOK_MAGIC_PENDING = 2;
    private static final int LOOK_ARTIFACT = 3;
    private static final int LOOK_ARTIFACT_PENDING = 4;
    private static final String[] LOOK_SPRITES = {
        null, "UI_Icon007.png", "UI_Icon007_Gold.png", "UI_Icon009.png", "UI_Icon009_Gold.png",
    };
    private final Bitmap[] lookBitmaps = new Bitmap[LOOK_SPRITES.length];

    private WindowManager windowManager;
    private ImageView bubble;
    private GradientDrawable bubbleRing;
    private WindowManager.LayoutParams bubbleParams;
    private View panel;
    private TextView syncLine;
    private WebView webView;
    private boolean panelOpen;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ScreenCapture capture = new ScreenCapture();
    /** Why live sync isn't running although it was asked for (null = no failure). */
    private String captureFailure;
    private String readerStatus;
    private long readerStatusAt;
    /** The web app has had nothing readable on screen for a while. */
    private boolean readerIdle;
    private boolean economy;
    private String versionName = "?";
    /** Frames handed to the reader over the last full minute (-1 until one has passed). */
    private int framesPerMinute = -1;
    private long rateWindowStart;
    private int rateWindowBase;
    /** The time stamp of the last touch that began on one of our own guards (see {@link #onOutsideTouch}). */
    private long ownTouchTime;
    private View pickStrip;
    private View notice;
    /**
     * The areas of the screen the reader is looking at right now (JSON, fractions of the screen).
     * While the bubble's resting place — {@code home} — overlaps one, it waits in the bottom corner.
     */
    private String avoidRects = "[]";
    private boolean steppedAside;
    private int homeX;
    private int homeY;
    /** Select Magic's tap guards, in the order the web app listed them; {@code markedGuard} is the one let through. */
    private final List<View> guards = new ArrayList<>();
    private String guardLayout;
    private int markedGuard = -1;
    private final Runnable dropGuards = this::removeGuards;
    private final Runnable dismissPick = this::removePickStrip;
    private final Runnable dismissNotice = this::removeNotice;
    /** The last tick already found the run itself on screen (and told the web app so). */
    private boolean wasPlaying;
    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!capture.isRunning()) return;
            // Our own panel on screen would be read as if it were the game (it looks like it on purpose).
            if (panelOpen) {
                wasPlaying = false;
                steady = false;
            } else {
                boolean playing = capture.showsTheRun();
                steady = playing && wasPlaying && readerStatus != null;
                if (steady) {
                    // Still just the run — the tick that happens all game long. Nothing is copied and the web app
                    // isn't woken: three pixels were all there was to look at.
                    readerStatusAt = SystemClock.uptimeMillis();
                } else {
                    // Where the bubble is goes along: it is in the picture too, and must not be read as part of a row.
                    Point screen = screenSize();
                    webView.evaluateJavascript("window.__msCapture&&window.__msCapture.tick(" + playing
                            + "," + (float) bubbleParams.x / screen.x + "," + (float) bubbleParams.y / screen.y
                            + "," + (float) bubbleParams.width / screen.x + "," + (float) bubbleParams.height / screen.y + ")", null);
                }
                wasPlaying = playing;
            }
            capture.requestFrame();
            if (!steady || ++steadyTicks % STEADY_REFRESH_EVERY == 0) refreshSyncStatus();
            // Nothing is read while the panel is open, so there is nothing to hurry for.
            long delay = panelOpen ? TICK_ECONOMY_MS : steady || wasPlaying ? TICK_PLAYING_MS : readerIdle ? TICK_IDLE_MS : TICK_MENU_MS;
            main.postDelayed(this, economy ? Math.max(delay, TICK_ECONOMY_MS) : delay);
        }
    };
    private boolean steady;
    private int steadyTicks;
    /** What the header and the bubble currently show, so a tick that changes nothing redraws nothing. */
    private String shownLine;
    private int shownRing;
    private int shownLook = -1;
    /**
     * A choice the game itself selects before it confirms, as the web app last reported it: 0 none on screen;
     * the artifact-offer panel, 1 open, 2 a card selected; Enchant's grid of magics, 3 open, 4 a magic selected.
     */
    private int choiceState;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = getSystemService(WindowManager.class);
        try {
            versionName = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException impossible) {
            // Our own package is always found.
        }
        startInForeground(false);
        panel = buildPanel();
        windowManager.addView(panel, panelParams(false));
        addBubble();
        refreshSyncStatus();
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
        removeGuards();
        removePickStrip();
        removeNotice();
        if (panel != null) windowManager.removeView(panel);
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
        captureFailure = null;
        readerStatus = null;
        wasPlaying = false;
        economy = intent.getBooleanExtra(EXTRA_ECONOMY, false);
        capture.setEconomy(economy);
        readerIdle = false;
        framesPerMinute = -1;
        rateWindowStart = SystemClock.uptimeMillis();
        rateWindowBase = 0;
        try {
            startInForeground(true);
            capture.start(this, intent.getIntExtra(EXTRA_RESULT_CODE, 0), data, main, () -> {
                startInForeground(false);
                setAvoid("[]");
                choiceState = 0;
                refreshSyncStatus();
            });
            if (!capture.isRunning()) captureFailure = "no projection";
        } catch (RuntimeException refused) {
            // Carry on as the plain bubble, and say why in the panel's header.
            capture.stop();
            captureFailure = refused.getClass().getSimpleName() + ": " + refused.getMessage();
            startInForeground(false);
        }
        refreshSyncStatus();
        if (!capture.isRunning()) return;
        main.removeCallbacks(tick);
        main.postDelayed(tick, TICK_MENU_MS);
    }

    /** The header line and the bubble's ring: off, broken (with the reason) or alive (with what the reader sees). */
    private void refreshSyncStatus() {
        String line;
        int ring;
        if (!capture.isRunning()) {
            line = captureFailure != null ? getString(R.string.sync_failed, versionName, captureFailure) : getString(R.string.sync_off, versionName);
            ring = captureFailure != null ? RING_BROKEN : RING_OFF;
        } else if (readerStatus == null) {
            line = getString(R.string.sync_silent, versionName, capture.framesServed());
            ring = RING_BROKEN;
        } else {
            // A running total says little (it also counts the minutes spent in the game's menus); the last full
            // minute is the number that should stay near zero while the player is simply playing.
            long now = SystemClock.uptimeMillis();
            if (now - rateWindowStart >= 60000) {
                framesPerMinute = capture.framesServed() - rateWindowBase;
                rateWindowBase = capture.framesServed();
                rateWindowStart = now;
            }
            line = getString(R.string.sync_reading, versionName, readerStatus, capture.framesServed(),
                    framesPerMinute < 0 ? "…" : String.valueOf(framesPerMinute));
            // The reader is only asked while the panel is parked, so its silence means nothing while it is open.
            boolean silent = !panelOpen && SystemClock.uptimeMillis() - readerStatusAt > SILENT_MS;
            ring = silent ? RING_BROKEN : RING_ALIVE;
        }
        if (!line.equals(shownLine)) {
            shownLine = line;
            syncLine.setText(line);
        }
        if (bubbleRing == null) return;
        // A choice outranks the sync colors: it is what the player needs to see before tapping.
        int look = LOOK_DEFAULT;
        if (!guards.isEmpty()) look = markedGuard >= 0 ? LOOK_MAGIC_PENDING : LOOK_MAGIC;
        else if (choiceState == 1) look = LOOK_ARTIFACT;
        else if (choiceState == 2) look = LOOK_ARTIFACT_PENDING;
        else if (choiceState == 3) look = LOOK_MAGIC;
        else if (choiceState == 4) look = LOOK_MAGIC_PENDING;
        if (look != LOOK_DEFAULT) ring = look == LOOK_MAGIC_PENDING || look == LOOK_ARTIFACT_PENDING ? RING_PENDING : RING_READY;
        // This runs every tick; the bubble is only touched (and redrawn) when what it shows really changed.
        if (ring == shownRing && look == shownLook) return;
        shownRing = ring;
        shownLook = look;
        bubbleRing.setStroke(dp(2), ring);
        Bitmap sprite = lookBitmap(look);
        if (sprite != null) bubble.setImageBitmap(sprite);
        else bubble.setImageResource(R.drawable.bubble_glyph);
    }

    private Bitmap lookBitmap(int look) {
        if (LOOK_SPRITES[look] == null) return null;
        if (lookBitmaps[look] == null) {
            try (InputStream stream = getAssets().open("web/assets/uiImages/icons/" + LOOK_SPRITES[look])) {
                lookBitmaps[look] = BitmapFactory.decodeStream(stream);
            } catch (IOException missing) {
                return null;
            }
        }
        return lookBitmaps[look];
    }

    /** What the web app calls back into (window.MSCompanionHost — see src/capture/bridge.ts). */
    public final class Host {
        @JavascriptInterface
        public void toast(String text) {
            main.post(() -> showNotice(text));
        }

        @JavascriptInterface
        public void askPick(String prompt, String optionsJson) {
            main.post(() -> showPickStrip(prompt, optionsJson));
        }

        @JavascriptInterface
        public void guard(String rectsJson) {
            main.post(() -> showGuards(rectsJson));
        }

        @JavascriptInterface
        public void unguard() {
            main.post(OverlayService.this::removeGuards);
        }

        @JavascriptInterface
        public void remark(int index) {
            main.post(() -> {
                if (index >= 0 && index < guards.size()) markGuard(index, false);
            });
        }

        @JavascriptInterface
        public void idle(boolean idle) {
            main.post(() -> readerIdle = idle);
        }

        @JavascriptInterface
        public void avoid(String rectsJson) {
            main.post(() -> setAvoid(rectsJson));
        }

        @JavascriptInterface
        public void choice(int state) {
            main.post(() -> {
                choiceState = state;
                refreshSyncStatus();
            });
        }

        @JavascriptInterface
        public void status(String text) {
            main.post(() -> {
                readerStatus = text;
                readerStatusAt = SystemClock.uptimeMillis();
                refreshSyncStatus();
            });
        }
    }

    /**
     * "Mark, then confirm" for Select Magic. The game picks a row the instant it is tapped and
     * shows no selection first, and Android never lets one app see taps meant for another — so
     * the only way to know the pick is to take the first tap ourselves. Each rectangle (a row,
     * or the Retrieve button) gets an invisible window that swallows taps. Tapping one marks it:
     * its window starts letting touches through, so the *next* tap there reaches the game, while
     * the others keep swallowing. The game can therefore only ever receive a tap on the marked
     * one — the same select-then-confirm the game itself uses for chests and attributes.
     *
     * Nothing is drawn over the game. The bubble carries the state instead: it turns into the
     * Owned Magic icon — white while the guards are up and nothing is marked ("ready — your first
     * tap marks"), gold once something is — with a beat every time a mark registers.
     */
    private void showGuards(String rectsJson) {
        main.removeCallbacks(dropGuards);
        if (panelOpen) return;
        main.postDelayed(dropGuards, GUARD_KEEPALIVE_MS);
        // Unchanged, or frozen: once something is marked, its frame is part of what the reader sees.
        if (!guards.isEmpty() && (markedGuard >= 0 || rectsJson.equals(guardLayout))) return;
        removeGuardViews();
        Point screen = screenSize();
        try {
            JSONArray rects = new JSONArray(rectsJson);
            for (int i = 0; i < rects.length(); i++) {
                JSONObject rect = rects.getJSONObject(i);
                final int index = i;
                View guard = new View(this);
                guard.setOnTouchListener((view, event) -> {
                    if (event.getActionMasked() == MotionEvent.ACTION_DOWN) ownTouchTime = event.getEventTime();
                    if (event.getActionMasked() == MotionEvent.ACTION_UP) markGuard(index, true);
                    return true;
                });
                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                        (int) Math.round(rect.getDouble("w") * screen.x), (int) Math.round(rect.getDouble("h") * screen.y),
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, GUARD_FLAGS, PixelFormat.TRANSLUCENT);
                params.gravity = Gravity.TOP | Gravity.START;
                params.x = (int) Math.round(rect.getDouble("x") * screen.x);
                params.y = (int) Math.round(rect.getDouble("y") * screen.y);
                if (Build.VERSION.SDK_INT >= 28) {
                    params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                }
                windowManager.addView(guard, params);
                guards.add(guard);
            }
        } catch (JSONException malformed) {
            removeGuardViews();
            return;
        }
        guardLayout = rectsJson;
        // Windows stack in the order they were added: put the bubble back on top, so it can still be
        // tapped (to consult the companion before picking) where it overlaps a guarded row.
        windowManager.removeViewImmediate(bubble);
        windowManager.addView(bubble, bubbleParams);
        refreshSyncStatus();
    }

    /**
     * A touch began somewhere outside the bubble's window (the bubble watches for those). Android says no more
     * than that — not where, when it landed on another app — but together with the guards it is enough: a touch
     * that began on none of our guards while one is marked went through to the game, and with every other row
     * guarded the only place it can have gone through is the marked one. So that was the confirming tap: the
     * guards come down at once (they would otherwise swallow the player's first touches of the run until the
     * reader notices the screen is gone) and the web app is told.
     *
     * The same touch reaches a guard as its ACTION_DOWN when it began on one, carrying the same time stamp;
     * the two arrive in no fixed order, hence the short wait before comparing.
     */
    private void onOutsideTouch(long eventTime) {
        if (guards.isEmpty() || markedGuard < 0) return;
        main.postDelayed(() -> {
            if (eventTime == ownTouchTime || guards.isEmpty() || markedGuard < 0) return;
            removeGuards();
            webView.evaluateJavascript("window.__msCapture&&window.__msCapture.passed()", null);
        }, 40);
    }

    /** {@code byPlayer}: the player tapped it (the web app is told, the bubble beats) rather than the web app restoring a mark. */
    private void markGuard(int index, boolean byPlayer) {
        markedGuard = index;
        for (int i = 0; i < guards.size(); i++) {
            View guard = guards.get(i);
            WindowManager.LayoutParams params = (WindowManager.LayoutParams) guard.getLayoutParams();
            boolean marked = i == index;
            params.flags = marked ? GUARD_FLAGS | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE : GUARD_FLAGS;
            // Android 12+ blocks touches through another app's overlay unless the window itself is
            // (near) transparent — what it draws doesn't count, its alpha does.
            params.alpha = marked ? 0f : 1f;
            windowManager.updateViewLayout(guard, params);
        }
        refreshSyncStatus();
        if (!byPlayer) return;
        webView.evaluateJavascript("window.__msCapture&&window.__msCapture.mark(" + index + ")", null);
        // A beat for every mark: moving the mark to another row changes no color, but it still registered.
        // (Inward: the bubble's window is exactly its size, so growing would be clipped.)
        bubble.animate().cancel();
        bubble.setScaleX(0.72f);
        bubble.setScaleY(0.72f);
        bubble.animate().scaleX(1f).scaleY(1f).setDuration(220).start();
    }

    private void removeGuards() {
        main.removeCallbacks(dropGuards);
        removeGuardViews();
    }

    private void removeGuardViews() {
        for (View guard : guards) windowManager.removeView(guard);
        boolean had = !guards.isEmpty();
        guards.clear();
        guardLayout = null;
        markedGuard = -1;
        if (had && syncLine != null) refreshSyncStatus();
    }

    /**
     * A short line over the game — our own window, not a system Toast, so it shows the same on
     * every Android version. It sits in the bottom margin (clear of every area the screen
     * reading looks at) and lets touches through.
     */
    private void showNotice(String text) {
        removeNotice();
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(Color.WHITE);
        view.setTextSize(13);
        view.setSingleLine(true);
        view.setEllipsize(TextUtils.TruncateAt.END);
        view.setPadding(dp(12), dp(4), dp(12), dp(4));
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.parseColor("#141418"));
        background.setCornerRadius(dp(12));
        background.setStroke(dp(1), RING_ALIVE);
        view.setBackground(background);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.y = dp(10);
        // Android 12+ only lets touches pass through an overlay this see-through or more (the limit is 0.8;
        // 0.8f itself rounds to just above it).
        params.alpha = 0.75f;
        windowManager.addView(view, params);
        notice = view;
        main.postDelayed(dismissNotice, NOTICE_MS);
    }

    private void removeNotice() {
        main.removeCallbacks(dismissNotice);
        if (notice != null) windowManager.removeView(notice);
        notice = null;
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
        none.setTextColor(RING_BROKEN);
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

    /**
     * Long-press on the bubble: saves the frame live sync is reading to Pictures/MSCompanion,
     * exactly as the reader gets it — the picture to send along when a screen is misread.
     */
    private void saveCapture() {
        byte[] frame = capture.peekFrame();
        if (frame == null || Build.VERSION.SDK_INT < 29) {
            showNotice(getString(R.string.capture_not_saved));
            return;
        }
        ByteBuffer header = ByteBuffer.wrap(frame).order(java.nio.ByteOrder.LITTLE_ENDIAN);
        Bitmap bitmap = Bitmap.createBitmap(header.getInt(0), header.getInt(4), Bitmap.Config.ARGB_8888);
        bitmap.copyPixelsFromBuffer(ByteBuffer.wrap(frame, 8, frame.length - 8));

        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, "live-sync-" + System.currentTimeMillis() + ".png");
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
        values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/MSCompanion");
        Uri target = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        boolean saved = false;
        if (target != null) {
            try (OutputStream out = getContentResolver().openOutputStream(target)) {
                saved = out != null && bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
            } catch (IOException failed) {
                saved = false;
            }
        }
        showNotice(getString(saved ? R.string.capture_saved : R.string.capture_not_saved));
    }

    // --- Bubble ---

    private void addBubble() {
        int size = dp(BUBBLE_DP);
        bubble = new ImageView(this);
        bubble.setImageResource(R.drawable.bubble_glyph);
        bubble.setScaleType(ImageView.ScaleType.FIT_CENTER);
        bubble.setPadding(dp(10), dp(10), dp(10), dp(10));
        bubbleRing = new GradientDrawable();
        bubbleRing.setShape(GradientDrawable.OVAL);
        bubbleRing.setColor(Color.parseColor("#E6141418"));
        bubbleRing.setStroke(dp(2), RING_OFF);
        bubble.setBackground(bubbleRing);

        bubbleParams = new WindowManager.LayoutParams(size, size,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT);
        bubbleParams.gravity = Gravity.TOP | Gravity.START;
        if (Build.VERSION.SDK_INT >= 28) {
            // Coordinates count from the screen's real top-left, notch or not, so "bottom corner" is exact.
            bubbleParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        bubbleParams.x = prefs.getInt("x", 0);
        bubbleParams.y = Math.max(minBubbleY(), prefs.getInt("y", dp(160)));

        bubble.setOnTouchListener(new BubbleTouch());
        windowManager.addView(bubble, bubbleParams);
    }

    /**
     * The bubble is in the captured picture like everything else, so it must not sit on what the
     * reader looks at (it used to hide whatever magic was under it in the Owned lists). It only
     * moves when it actually would: resting on one of the areas the web app just listed, it
     * steps aside to the bottom corner on its own side — the one strip no menu draws anything
     * in — and comes back as soon as its resting place is clear again.
     */
    private void setAvoid(String rectsJson) {
        avoidRects = rectsJson;
        if (bubble == null) return;
        if (!steppedAside) {
            homeX = bubbleParams.x;
            homeY = bubbleParams.y;
        }
        boolean covering = coversAvoided(homeX, homeY);
        if (covering == steppedAside) return;
        steppedAside = covering;
        if (covering) slideBubble(homeX, cornerY());
        else slideBubble(homeX, homeY);
    }

    /** Whether the bubble, resting at this position, overlaps an area the reader is looking at. */
    private boolean coversAvoided(int x, int y) {
        Point screen = screenSize();
        try {
            JSONArray rects = new JSONArray(avoidRects);
            for (int i = 0; i < rects.length(); i++) {
                JSONObject rect = rects.getJSONObject(i);
                double left = rect.getDouble("x") * screen.x;
                double top = rect.getDouble("y") * screen.y;
                double right = left + rect.getDouble("w") * screen.x;
                double bottom = top + rect.getDouble("h") * screen.y;
                if (x < right && left < x + bubbleParams.width && y < bottom && top < y + bubbleParams.height) return true;
            }
        } catch (JSONException malformed) {
            return false;
        }
        return false;
    }

    private int cornerY() {
        return screenSize().y - bubbleParams.height - dp(4);
    }

    /** Just under the game's top bar: on it, the bubble would hide the pause button the reader knows the run by. */
    private int minBubbleY() {
        return Math.round(screenSize().y * 0.05f);
    }

    private void slideBubble(int toX, int toY) {
        int fromX = bubbleParams.x;
        int fromY = bubbleParams.y;
        ValueAnimator animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(180);
        animator.addUpdateListener(a -> {
            if (bubble == null || !bubble.isAttachedToWindow()) return;
            float t = (float) a.getAnimatedValue();
            bubbleParams.x = Math.round(fromX + (toX - fromX) * t);
            bubbleParams.y = Math.round(fromY + (toY - fromY) * t);
            windowManager.updateViewLayout(bubble, bubbleParams);
        });
        animator.start();
    }

    /** The whole screen, cutout and system bars included — the space the bubble's coordinates live in. */
    private Point screenSize() {
        Point size = new Point();
        getSystemService(DisplayManager.class).getDisplay(Display.DEFAULT_DISPLAY).getRealSize(size);
        return size;
    }

    /** Drag to move, tap to open, hold to save what live sync sees; on release it snaps to the
     *  nearer left/right edge (like the web app's own Magic Circle bubble), keeping the height
     *  it was dropped at. */
    private final class BubbleTouch implements View.OnTouchListener {
        private final int slop = ViewConfiguration.get(OverlayService.this).getScaledTouchSlop();
        private float downRawX, downRawY;
        private int startX, startY;
        private boolean dragging;
        private boolean held;
        private final Runnable longPress = () -> {
            held = true;
            saveCapture();
        };

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
                    held = false;
                    main.postDelayed(longPress, LONG_PRESS_MS);
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    if (held) return true;
                    float dx = event.getRawX() - downRawX;
                    float dy = event.getRawY() - downRawY;
                    if (!dragging && Math.hypot(dx, dy) > slop) {
                        dragging = true;
                        main.removeCallbacks(longPress);
                    }
                    if (dragging) {
                        bubbleParams.x = startX + Math.round(dx);
                        bubbleParams.y = startY + Math.round(dy);
                        windowManager.updateViewLayout(bubble, bubbleParams);
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    main.removeCallbacks(longPress);
                    if (held) return true;
                    if (dragging) snapToEdge();
                    else openPanel();
                    return true;
                case MotionEvent.ACTION_CANCEL:
                    main.removeCallbacks(longPress);
                    return true;
                case MotionEvent.ACTION_OUTSIDE:
                    onOutsideTouch(event.getEventTime());
                    return false;
                default:
                    return false;
            }
        }
    }

    private void snapToEdge() {
        Point screen = screenSize();
        int maxX = screen.x - bubbleParams.width;
        int maxY = screen.y - bubbleParams.height;
        int targetX = bubbleParams.x + bubbleParams.width / 2 < screen.x / 2 ? 0 : maxX;
        int targetY = Math.max(minBubbleY(), Math.min(bubbleParams.y, maxY));

        // Wherever it was dropped is its resting place from now on — even if, right now, that spot is
        // one the reader needs and it has to wait in the corner until the screen changes.
        homeX = targetX;
        homeY = targetY;
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putInt("x", targetX).putInt("y", targetY).apply();
        steppedAside = coversAvoided(targetX, targetY);
        slideBubble(targetX, steppedAside ? cornerY() : targetY);
    }

    // --- Panel ---

    /**
     * Open: the whole screen, focusable. Parked: the same size (so the web app's layout and
     * scroll positions survive), pushed off the right edge but for one transparent pixel column,
     * and deaf to touches and keys.
     */
    private WindowManager.LayoutParams panelParams(boolean open) {
        DisplayMetrics screen = getResources().getDisplayMetrics();
        WindowManager.LayoutParams params;
        if (open) {
            params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT);
            params.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        } else {
            params = new WindowManager.LayoutParams(
                    screen.widthPixels, screen.heightPixels,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.TRANSLUCENT);
            params.alpha = 0f;
            params.x = screen.widthPixels - 1;
        }
        params.gravity = Gravity.TOP | Gravity.START;
        return params;
    }

    /** Tells the web app whether anyone can see it, so it stops animating while parked (index.css, `.parked`). */
    private void markParked(boolean parked) {
        // Pauses the app's animations and timers (src/capture/bridge.ts); the class alone if the bridge isn't up yet.
        webView.evaluateJavascript("window.__msCapture?window.__msCapture.parked(" + parked
                + "):document.documentElement.classList.toggle('parked'," + parked + ")", null);
    }

    private void openPanel() {
        if (panelOpen) return;
        removePickStrip();
        // The guards sit above every other window of ours: left up, they would swallow taps meant for the panel.
        removeGuards();
        panelOpen = true;
        refreshSyncStatus();
        markParked(false);
        windowManager.updateViewLayout(panel, panelParams(true));
        bubble.setVisibility(View.GONE);
    }

    private void closePanel() {
        if (!panelOpen) return;
        panelOpen = false;
        // The reader starts from now: time spent in the panel is not silence.
        readerStatusAt = SystemClock.uptimeMillis();
        markParked(true);
        windowManager.updateViewLayout(panel, panelParams(false));
        bubble.setVisibility(View.VISIBLE);
        refreshSyncStatus();
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

        LinearLayout header = new LinearLayout(themed);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setBackgroundColor(Color.parseColor("#26262c"));

        syncLine = new TextView(themed);
        syncLine.setTextColor(Color.parseColor("#cfcfd4"));
        syncLine.setTextSize(11);
        syncLine.setMaxLines(2);
        syncLine.setEllipsize(TextUtils.TruncateAt.END);
        syncLine.setPadding(dp(12), 0, dp(8), 0);
        header.addView(syncLine, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView close = new TextView(themed);
        close.setText("×  " + getString(R.string.close_panel));
        close.setTextColor(Color.WHITE);
        close.setTextSize(15);
        close.setGravity(Gravity.CENTER_VERTICAL | Gravity.END);
        close.setPadding(dp(8), 0, dp(16), 0);
        close.setOnClickListener(v -> closePanel());
        header.addView(close, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT));
        root.addView(header, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(40)));

        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        webView = new WebView(themed);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        webView.setWebViewClient(new WebAssetClient(getAssets(), capture) {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (!panelOpen) markParked(true);
            }
        });
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
