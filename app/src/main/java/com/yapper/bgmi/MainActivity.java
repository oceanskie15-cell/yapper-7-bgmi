package com.yapper.bgmi;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.webkit.WebViewAssetLoader;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;

    public class Bridge {
        @JavascriptInterface
        public void googleSignIn(final String webClientId) {
            runOnUiThread(new Runnable() {
                public void run() { startGoogle(webClientId); }
            });
        }
    }

    private void js(final String tok, final String err) {
        final String code = "window.ypGoogleResult(" + (tok == null ? "null" : JSONObject.quote(tok))
                + "," + (err == null ? "null" : JSONObject.quote(err)) + ")";
        runOnUiThread(new Runnable() {
            public void run() { web.evaluateJavascript(code, null); }
        });
    }

    private void startGoogle(String webClientId) {
        CredentialManager cm = CredentialManager.create(this);
        GetSignInWithGoogleOption opt = new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest req = new GetCredentialRequest.Builder().addCredentialOption(opt).build();
        cm.getCredentialAsync(this, req, new CancellationSignal(), ContextCompat.getMainExecutor(this),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse r) {
                    Credential c = r.getCredential();
                    if (c instanceof CustomCredential
                            && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                        GoogleIdTokenCredential g = GoogleIdTokenCredential.createFrom(((CustomCredential) c).getData());
                        js(g.getIdToken(), null);
                    } else {
                        js(null, "Unsupported Google credential");
                    }
                }
                @Override
                public void onError(GetCredentialException e) {
                    js(null, "Google sign-in failed: " + e.getType() + " " + e.getMessage());
                }
            });
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });
        web.loadUrl("https://" + HOST + "/assets/index.html");
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
