package org.groestlcoin.jswallet;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

public class myJsInterface {

    private MainActivity con;
    private WebView webView;

    public myJsInterface(MainActivity con, WebView webView) {
        this.con = con;
        this.webView = webView;
    }

    public void jsFnCall(String method, String value) {
        webView.loadUrl("javascript:"+method+"('"+value+"');");
    }

    @JavascriptInterface
    public void saveHash(String hash) {
        SharedPreferences sharedPref = con.getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString(con.getString(R.string.saved_hash), hash);
        editor.commit();
    }

    @JavascriptInterface
    public void startQr() {
        this.con.switchActivity();
    }

    @JavascriptInterface
    public void showAlert(String title, String mssg) {
        AlertDialog.Builder builder = new AlertDialog.Builder(con);
        builder.setTitle(title)
               .setMessage(mssg);

        AlertDialog dialog = builder.create();
        dialog.show();
    }

    @JavascriptInterface
    public void showToast(String mssg) {
        Toast.makeText(this.con, mssg, Toast.LENGTH_LONG).show();
    }

}
