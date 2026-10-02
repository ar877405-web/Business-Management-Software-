package com.advanceddeeptrading.app;
import android.app.*; import android.os.*; import android.webkit.*; import android.view.*; import android.content.*; import android.net.Uri;
public class MainActivity extends Activity {
  WebView web; ValueCallback<Uri[]> callback;
  public void onCreate(Bundle b){ super.onCreate(b); web=new WebView(this); web.getSettings().setJavaScriptEnabled(true); web.getSettings().setDomStorageEnabled(true); web.setWebChromeClient(new WebChromeClient(){ public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> c,FileChooserParams p){ callback=c; startActivityForResult(p.createIntent(),42); return true; }}); web.loadUrl("file:///android_asset/index.html"); setContentView(web); }
  protected void onActivityResult(int r,int c,Intent d){ super.onActivityResult(r,c,d); if(r==42&&callback!=null){ callback.onReceiveValue(c==RESULT_OK&&d!=null?new Uri[]{d.getData()}:null); callback=null; } }
  public void onBackPressed(){ if(web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
