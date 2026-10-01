package com.mcchama.mscompanion;

import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Serves the bundled web app (assets/web, the repo's own `dist/`) from a real https origin
 * instead of file://, which is what makes the Vite build work unchanged: ES module scripts load
 * (file:// blocks them), localStorage persists per origin (the saved run), and the build's
 * absolute `/magic-survival-cheet-sheet/...` URLs resolve exactly as on GitHub Pages.
 * `appassets.androidplatform.net` is the host Android reserves for this, never a real network call.
 */
class WebAssetClient extends WebViewClient {
    static final String HOST = "appassets.androidplatform.net";
    /** Vite's `base` (vite.config.ts); change both together. */
    static final String BASE_PATH = "/magic-survival-cheet-sheet/";
    static final String START_URL = "https://" + HOST + BASE_PATH + "index.html";

    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put("html", "text/html");
        MIME.put("js", "text/javascript");
        MIME.put("mjs", "text/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("webp", "image/webp");
        MIME.put("gif", "image/gif");
        MIME.put("ttf", "font/ttf");
        MIME.put("otf", "font/otf");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("mp3", "audio/mpeg");
        MIME.put("ogg", "audio/ogg");
        MIME.put("wav", "audio/wav");
        MIME.put("txt", "text/plain");
    }

    /** Where the web app fetches the captured screen from (src/capture/bridge.ts). */
    static final String FRAME_PATH = BASE_PATH + "__capture/frame";

    /** The latest captured screen: an 8-byte header (width, height as little-endian ints) then RGBA rows. */
    interface FrameSource {
        /** Null when there is no capture, or nothing new since the last call. */
        byte[] takeFrame();
    }

    private final AssetManager assets;
    private final FrameSource frames;

    WebAssetClient(AssetManager assets, FrameSource frames) {
        this.assets = assets;
        this.frames = frames;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        if (!HOST.equals(url.getHost())) return null;
        String path = url.getPath();
        if (path == null || !path.startsWith(BASE_PATH)) return notFound();
        if (path.equals(FRAME_PATH)) return frame();

        String relative = path.substring(BASE_PATH.length());
        if (relative.isEmpty() || relative.endsWith("/")) relative += "index.html";
        try {
            InputStream stream = assets.open("web/" + relative);
            String mime = mimeFor(relative);
            String encoding = mime.startsWith("text/") || mime.endsWith("json") ? "utf-8" : null;
            return new WebResourceResponse(mime, encoding, stream);
        } catch (IOException missing) {
            return notFound();
        }
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // Everything stays inside the panel; the app has no outbound links to follow.
        return !HOST.equals(request.getUrl().getHost());
    }

    private static String mimeFor(String path) {
        int dot = path.lastIndexOf('.');
        String type = dot < 0 ? null : MIME.get(path.substring(dot + 1).toLowerCase());
        return type != null ? type : "application/octet-stream";
    }

    private WebResourceResponse frame() {
        byte[] bytes = frames.takeFrame();
        WebResourceResponse response = new WebResourceResponse(
                "application/octet-stream", null, new ByteArrayInputStream(bytes != null ? bytes : new byte[0]));
        if (bytes == null) response.setStatusCodeAndReasonPhrase(204, "No Content");
        return response;
    }

    private static WebResourceResponse notFound() {
        WebResourceResponse response = new WebResourceResponse(
                "text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        response.setStatusCodeAndReasonPhrase(404, "Not Found");
        return response;
    }
}
