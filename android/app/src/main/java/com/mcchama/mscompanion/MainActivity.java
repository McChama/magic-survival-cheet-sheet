package com.mcchama.mscompanion;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.widget.Button;
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

    private void play() {
        startForegroundService(new Intent(this, OverlayService.class));
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
