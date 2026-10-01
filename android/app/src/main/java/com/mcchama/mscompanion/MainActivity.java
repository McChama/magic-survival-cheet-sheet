package com.mcchama.mscompanion;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.projection.MediaProjectionConfig;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * The launcher screen: the one-time overlay permission, then "Play with companion", which
 * starts the bubble ({@link OverlayService}) and opens the real, unmodified game. Opening this
 * app instead of the game is the whole "modded" experience — nothing inside the game changes.
 */
public class MainActivity extends Activity {
    static final String GAME_PACKAGE = "com.vkslrzm.Zombie";

    private TextView status;
    private Button grantButton;
    private Button playButton;
    private CheckBox liveSync;

    private static final int REQUEST_CAPTURE = 2;
    private static final String PREFS = "launcher";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int pad = dp(24);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setBackgroundColor(Color.parseColor("#141418"));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.bubble_glyph);
        root.addView(logo, new LinearLayout.LayoutParams(dp(96), dp(96)));

        TextView title = text(getString(R.string.launcher_title), 24, "#efc84f");
        root.addView(title);

        TextView blurb = text(getString(R.string.launcher_blurb), 14, "#cfcfd4");
        root.addView(blurb);

        status = text("", 14, "#ffffff");
        root.addView(status);

        grantButton = button(getString(R.string.grant_permission));
        grantButton.setOnClickListener(v -> startActivity(new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()))));
        root.addView(grantButton);

        liveSync = new CheckBox(this);
        liveSync.setText(R.string.live_sync);
        liveSync.setTextColor(Color.WHITE);
        liveSync.setChecked(getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("liveSync", true));
        liveSync.setOnCheckedChangeListener((box, checked) ->
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("liveSync", checked).apply());
        root.addView(liveSync);
        root.addView(text(getString(R.string.live_sync_blurb), 12, "#9a9aa2"));

        playButton = button(getString(R.string.play));
        playButton.setOnClickListener(v -> play());
        root.addView(playButton);

        Button stopButton = button(getString(R.string.stop));
        stopButton.setOnClickListener(v -> stopService(new Intent(this, OverlayService.class)));
        root.addView(stopButton);

        setContentView(root);

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 1);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        boolean allowed = Settings.canDrawOverlays(this);
        status.setText(allowed ? R.string.permission_ok : R.string.permission_missing);
        status.setTextColor(Color.parseColor(allowed ? "#3fdc5a" : "#f0603c"));
        grantButton.setEnabled(!allowed);
        playButton.setEnabled(allowed);
    }

    /** Starts the bubble, then (with live sync on) asks Android for the screen before opening the game. */
    private void play() {
        startForegroundService(new Intent(this, OverlayService.class));
        if (!liveSync.isChecked()) {
            launchGame();
            return;
        }
        MediaProjectionManager manager = getSystemService(MediaProjectionManager.class);
        // Android 14+ can also offer "a single app"; the game isn't running yet, so ask for the whole screen.
        Intent prompt = Build.VERSION.SDK_INT >= 34
                ? manager.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
                : manager.createScreenCaptureIntent();
        startActivityForResult(prompt, REQUEST_CAPTURE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_CAPTURE) return;
        // Declined: the companion still works, just without reading the screen.
        if (resultCode == RESULT_OK && data != null) {
            startForegroundService(new Intent(this, OverlayService.class)
                    .setAction(OverlayService.ACTION_START_CAPTURE)
                    .putExtra(OverlayService.EXTRA_RESULT_CODE, resultCode)
                    .putExtra(OverlayService.EXTRA_RESULT_DATA, data));
        }
        launchGame();
    }

    private void launchGame() {
        Intent game = getPackageManager().getLaunchIntentForPackage(GAME_PACKAGE);
        if (game == null) {
            Toast.makeText(this, R.string.game_not_installed, Toast.LENGTH_LONG).show();
            return;
        }
        startActivity(game);
    }

    private TextView text(String value, int sp, String color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(Color.parseColor(color));
        view.setGravity(Gravity.CENTER);
        view.setPadding(0, dp(8), 0, dp(8));
        return view;
    }

    private Button button(String label) {
        Button view = new Button(this);
        view.setText(label);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(8);
        view.setLayoutParams(params);
        return view;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
