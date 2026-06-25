package com.maestro.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MaestroJsBridge {
    private final Activity activity;
    private final WebView webView;
    static final int PICK_FILE_REQUEST = 1;

    public MaestroJsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    // ── File picker ────────────────────────────────────────────────
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

    // ── Claude API (bypasses CORS) ─────────────────────────────────
    @JavascriptInterface
    public void claudeChat(final String callbackId, final String apiKey,
                           final String model, final String systemB64,
                           final String messagesB64) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    String systemPrompt = b64Decode(systemB64);
                    String messagesJson = b64Decode(messagesB64);

                    // Escape system prompt for embedding in JSON string
                    String safeSystem = escapeJsonString(systemPrompt);
                    String body = "{\"model\":\"" + model + "\","
                        + "\"max_tokens\":2048,"
                        + "\"system\":\"" + safeSystem + "\","
                        + "\"messages\":" + messagesJson + "}";

                    HttpURLConnection conn = openPost(
                        "https://api.anthropic.com/v1/messages");
                    conn.setRequestProperty("x-api-key", apiKey);
                    conn.setRequestProperty("anthropic-version", "2023-06-01");
                    conn.setRequestProperty("content-type", "application/json");
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(60000);

                    writeBody(conn, body);

                    final int code = conn.getResponseCode();
                    final String response = readFully(
                        code >= 200 && code < 300 ? conn.getInputStream()
                                                  : conn.getErrorStream());

                    // Return response as b64 to avoid JS escaping issues
                    final String encoded = b64Encode(response);
                    jsCallback("window.maestroApiResult('" + callbackId + "',"
                        + code + ",'" + encoded + "')");

                } catch (final Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : "network error";
                    jsCallback("window.maestroApiResult('" + callbackId + "',0,'"
                        + b64Encode(msg) + "')");
                }
            }
        }).start();
    }

    // ── ElevenLabs TTS (bypasses CORS) ────────────────────────────
    @JavascriptInterface
    public void elevenLabsSpeak(final String callbackId, final String apiKey,
                                final String voiceId, final String textB64) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    String text = b64Decode(textB64);
                    // Truncate to 1000 chars to stay within ElevenLabs limits
                    if (text.length() > 1000) text = text.substring(0, 1000);
                    String safeText = escapeJsonString(text);

                    String body = "{\"text\":\"" + safeText + "\","
                        + "\"model_id\":\"eleven_monolingual_v1\","
                        + "\"voice_settings\":{\"stability\":0.5,"
                        + "\"similarity_boost\":0.75}}";

                    HttpURLConnection conn = openPost(
                        "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId);
                    conn.setRequestProperty("xi-api-key", apiKey);
                    conn.setRequestProperty("content-type", "application/json");
                    conn.setRequestProperty("accept", "audio/mpeg");
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(60000);

                    writeBody(conn, body);

                    final int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        byte[] audioBytes = readBytes(conn.getInputStream());
                        final String audioB64 = Base64.encodeToString(
                            audioBytes, Base64.NO_WRAP);
                        jsCallback("window.maestroAudioResult('" + callbackId
                            + "','ok','" + audioB64 + "')");
                    } else {
                        jsCallback("window.maestroAudioResult('" + callbackId
                            + "','error:' + " + code + ",'')");
                    }
                } catch (final Exception e) {
                    jsCallback("window.maestroAudioResult('" + callbackId
                        + "','error','')");
                }
            }
        }).start();
    }

    // ── Utility ────────────────────────────────────────────────────
    @JavascriptInterface
    public void log(String message) {
        android.util.Log.d("Maestro", message);
    }

    @JavascriptInterface
    public void vibrate(int ms) {
        try {
            android.os.Vibrator v = (android.os.Vibrator)
                activity.getSystemService(Activity.VIBRATOR_SERVICE);
            if (v != null) v.vibrate(ms);
        } catch (Exception ignored) {}
    }

    // ── File result callbacks ──────────────────────────────────────
    public void handleFileResult(final Uri uri) {
        try {
            InputStream is = activity.getContentResolver().openInputStream(uri);
            if (is == null) return;
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line).append("\n");
            reader.close();

            final String content = sb.toString()
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\r", "")
                .replace("\n", "\\n");
            final String filename = getFileName(uri);

            jsCallback("window.maestroFileReceived('" + filename + "','" + content + "')");
        } catch (final Exception e) {
            final String msg = (e.getMessage() != null ? e.getMessage() : "error")
                .replace("'", "\\'");
            jsCallback("window.maestroFileError('" + msg + "')");
        }
    }

    public void handleMultipleFiles(android.content.ClipData clipData) {
        for (int i = 0; i < clipData.getItemCount(); i++) {
            handleFileResult(clipData.getItemAt(i).getUri());
        }
    }

    // ── Helpers ────────────────────────────────────────────────────
    private void jsCallback(final String js) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                webView.evaluateJavascript(js, null);
            }
        });
    }

    private static HttpURLConnection openPost(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        return conn;
    }

    private static void writeBody(HttpURLConnection conn, String body) throws Exception {
        byte[] bytes = body.getBytes("UTF-8");
        conn.setFixedLengthStreamingMode(bytes.length);
        OutputStream os = conn.getOutputStream();
        os.write(bytes);
        os.flush();
    }

    private static String readFully(InputStream is) throws Exception {
        if (is == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line).append("\n");
        reader.close();
        return sb.toString().trim();
    }

    private static byte[] readBytes(InputStream is) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
        is.close();
        return baos.toByteArray();
    }

    private static String b64Encode(String s) {
        try {
            return Base64.encodeToString(s.getBytes("UTF-8"), Base64.NO_WRAP);
        } catch (Exception e) { return ""; }
    }

    private static String b64Decode(String b64) {
        try {
            return new String(Base64.decode(b64, Base64.DEFAULT), "UTF-8");
        } catch (Exception e) { return ""; }
    }

    private static String escapeJsonString(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
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
