package com.maestro.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MaestroJsBridge {
    private final Activity activity;
    private final WebView webView;
    static final int PICK_FILE_REQUEST = 1;

    public MaestroJsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void openFilePicker() {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                activity.startActivityForResult(intent, PICK_FILE_REQUEST);
            }
        });
    }

    @JavascriptInterface
    public void log(String message) {
        android.util.Log.d("Maestro", message);
    }

    @JavascriptInterface
    public void vibrate(int ms) {
        android.os.Vibrator v = (android.os.Vibrator) activity.getSystemService(Activity.VIBRATOR_SERVICE);
        if (v != null) {
            v.vibrate(ms);
        }
    }

    public void handleFileResult(final Uri uri) {
        try {
            InputStream inputStream = activity.getContentResolver().openInputStream(uri);
            if (inputStream == null) return;
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            reader.close();

            String raw = sb.toString();
            final String content = raw
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\r", "")
                .replace("\n", "\\n");
            final String filename = getFileName(uri);

            activity.runOnUiThread(new Runnable() {
                public void run() {
                    webView.evaluateJavascript(
                        "window.maestroFileReceived('" + filename + "', '" + content + "')", null);
                }
            });
        } catch (final Exception e) {
            final String msg = e.getMessage() != null ? e.getMessage().replace("'", "\\'") : "unknown";
            activity.runOnUiThread(new Runnable() {
                public void run() {
                    webView.evaluateJavascript("window.maestroFileError('" + msg + "')", null);
                }
            });
        }
    }

    public void handleMultipleFiles(android.content.ClipData clipData) {
        int count = clipData.getItemCount();
        for (int i = 0; i < count; i++) {
            handleFileResult(clipData.getItemAt(i).getUri());
        }
    }

    private String getFileName(Uri uri) {
        String path = uri.getLastPathSegment();
        if (path != null) {
            int cut = path.lastIndexOf('/');
            return cut != -1 ? path.substring(cut + 1) : path;
        }
        return "persona.yaml";
    }
}
