package com.kevindaniel.paravocemeuamor;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.graphics.Color;

import org.json.JSONArray;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String REMOTE_CONTENT_URL = "https://pra-vc-vidinha-jk.netlify.app/content/manwhas.json";
    private WebView webView;
    private File catalogFile;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(12,10,20));
        getWindow().setNavigationBarColor(Color.rgb(12,10,20));
        catalogFile = new File(getFilesDir(), "manwhas.json");
        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setLoadsImagesAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        webView.setBackgroundColor(Color.rgb(12,10,20));
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new ContentBridge(this), "AndroidContent");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u=r.getUrl().toString();
                if (u.startsWith("file:///android_asset/") || u.startsWith("https://pra-vc-vidinha-jk.netlify.app/")) return false;
                return false;
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
        new Handler().postDelayed(() -> updateCatalogIfNeeded(), 900);
    }

    private boolean hasNetwork() {
        ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkCapabilities nc=cm.getNetworkCapabilities(cm.getActiveNetwork());
        return nc!=null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void updateCatalogIfNeeded() {
        if(!hasNetwork()) return;
        new Thread(() -> {
            try {
                HttpURLConnection c=(HttpURLConnection)new URL(REMOTE_CONTENT_URL).openConnection();
                c.setConnectTimeout(7000); c.setReadTimeout(10000); c.setRequestMethod("GET"); c.setUseCaches(false);
                int code=c.getResponseCode();
                if(code<200 || code>=300) return;
                String json=readAll(c.getInputStream());
                new JSONArray(json); // validate before replacing local catalog
                String old=catalogFile.exists()?readAll(new FileInputStream(catalogFile)):"";
                if(!json.equals(old)) {
                    try(FileOutputStream out=new FileOutputStream(catalogFile,false)){out.write(json.getBytes(StandardCharsets.UTF_8));}
                    runOnUiThread(() -> webView.reload());
                }
                c.disconnect();
            } catch(Exception ignored) {}
        }).start();
    }

    private static String readAll(InputStream in) throws Exception {
        try(InputStream x=in; ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] b=new byte[8192]; int n; while((n=x.read(b))!=-1) out.write(b,0,n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }

    public class ContentBridge {
        private final Context ctx;
        ContentBridge(Context c){ctx=c;}
        @JavascriptInterface public String getManwhas() {
            try {
                if(catalogFile.exists()) return readAll(new FileInputStream(catalogFile));
                InputStream in=ctx.getAssets().open("content/manwhas.json");
                return readAll(in);
            } catch(Exception e){ return "[]"; }
        }
    }

    @Override public void onBackPressed() {
        if(webView!=null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy(){ if(webView!=null) webView.destroy(); super.onDestroy(); }
}
