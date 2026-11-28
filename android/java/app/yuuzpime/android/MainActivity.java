package app.yuuzpime.android;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final String HOME = "https://appassets.androidplatform.net/index.html";
    private FrameLayout root, fullscreen;
    private WebView web;
    private LinearLayout errorPanel;
    private ProgressBar progress;
    private View videoView;
    private WebChromeClient.CustomViewCallback videoCallback;
    private boolean mainError;
    private int insetLeft, insetTop, insetRight, insetBottom;

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(16,16,16));
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                insetLeft = safe.left; insetTop = safe.top; insetRight = safe.right; insetBottom = safe.bottom;
            } else {
                insetLeft = insets.getSystemWindowInsetLeft(); insetTop = insets.getSystemWindowInsetTop();
                insetRight = insets.getSystemWindowInsetRight(); insetBottom = insets.getSystemWindowInsetBottom();
            }
            if (videoView == null) root.setPadding(insetLeft, insetTop, insetRight, insetBottom);
            return insets;
        });
        root.requestApplyInsets();
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(16,16,16));
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        root.addView(progress, new FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP));

        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(24),dp(24),dp(24),dp(24));
        errorPanel.setBackgroundColor(Color.rgb(16,16,16));
        TextView title = new TextView(this);
        title.setText("YuuZPime"); title.setTextSize(28); title.setTextColor(Color.WHITE);
        errorPanel.addView(title);
        TextView message = new TextView(this);
        message.setText("Aset aplikasi tidak dapat dimuat. Coba buka ulang aplikasi.");
        message.setTextColor(Color.LTGRAY); message.setGravity(Gravity.CENTER);
        message.setPadding(0,dp(12),0,dp(20));
        errorPanel.addView(message);
        Button retry = new Button(this);
        retry.setText("Coba lagi");
        retry.setOnClickListener(v -> { errorPanel.setVisibility(View.GONE); mainError=false; web.loadUrl(HOME); });
        errorPanel.addView(retry);
        root.addView(errorPanel, new FrameLayout.LayoutParams(-1,-1));
        errorPanel.setVisibility(View.GONE);

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u=request.getUrl();
                if (!"https".equals(u.getScheme()) || !"appassets.androidplatform.net".equals(u.getHost())) return null;
                String p=u.getPath(); if(p==null||p.equals("/"))p="/index.html";
                if(p.contains("..")||p.contains("\\")) return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));
                String mime=p.endsWith(".js")?"application/javascript":p.endsWith(".css")?"text/css":p.endsWith(".html")?"text/html":p.endsWith(".svg")?"image/svg+xml":p.endsWith(".png")?"image/png":p.endsWith(".woff")?"font/woff":p.endsWith(".woff2")?"font/woff2":"application/octet-stream";
                try{return new WebResourceResponse(mime,mime.startsWith("text/")||mime.equals("application/javascript")?"UTF-8":null,getAssets().open("miru"+p));}
                catch(java.io.IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri=request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && "appassets.androidplatform.net".equalsIgnoreCase(uri.getHost())) return false;
                if ("https".equalsIgnoreCase(uri.getScheme()) && request.hasGesture()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); } catch (Exception ignored) {}
                }
                return true;
            }
            @Override public void onPageStarted(WebView v,String url,android.graphics.Bitmap favicon) {
                mainError=false; errorPanel.setVisibility(View.GONE); progress.setVisibility(View.VISIBLE);
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error) {
                if(request.isForMainFrame()) showError();
            }
            @Override public void onReceivedHttpError(WebView v,WebResourceRequest request,WebResourceResponse response) {
                if(request.isForMainFrame() && response.getStatusCode()>=400) showError();
            }
            @Override public void onPageFinished(WebView v,String url) {
                progress.setVisibility(View.GONE);
                if(!mainError) errorPanel.setVisibility(View.GONE);
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView v,int n) { progress.setProgress(n); progress.setVisibility(n>=100 || mainError?View.GONE:View.VISIBLE); }
            @Override public void onShowCustomView(View view,CustomViewCallback callback) {
                if(videoView!=null){callback.onCustomViewHidden();return;}
                videoView=view;videoCallback=callback;
                fullscreen=new FrameLayout(MainActivity.this);fullscreen.setBackgroundColor(Color.BLACK);
                root.setPadding(0,0,0,0);
                fullscreen.addView(view,new FrameLayout.LayoutParams(-1,-1));root.addView(fullscreen,new FrameLayout.LayoutParams(-1,-1));
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            }
            @Override public void onHideCustomView(){ hideVideo(); }
        });
        if(state==null || web.restoreState(state)==null) web.loadUrl(HOME);
    }

    private void showError(){mainError=true;progress.setVisibility(View.GONE);errorPanel.setVisibility(View.VISIBLE);}
    private void hideVideo(){
        if(videoView==null)return;
        root.removeView(fullscreen);fullscreen.removeAllViews();fullscreen=null;videoView=null;
        WebChromeClient.CustomViewCallback callback=videoCallback;videoCallback=null;
        root.setSystemUiVisibility(0);
        root.setPadding(insetLeft,insetTop,insetRight,insetBottom);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if(callback!=null) callback.onCustomViewHidden();
    }
    @Override public void onBackPressed(){if(videoView!=null){hideVideo();}else if(errorPanel.getVisibility()==View.VISIBLE){finish();}else if(web.canGoBack()){web.goBack();}else{super.onBackPressed();}}
    @Override protected void onSaveInstanceState(Bundle state){web.saveState(state);super.onSaveInstanceState(state);}
    @Override protected void onPause(){super.onPause();web.onPause();}
    @Override protected void onResume(){super.onResume();web.onResume();}
    @Override protected void onDestroy(){hideVideo();root.removeView(web);web.stopLoading();web.destroy();super.onDestroy();}
}
