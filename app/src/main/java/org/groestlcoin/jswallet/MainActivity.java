package org.groestlcoin.jswallet;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Handler;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.vision.barcode.Barcode;

public class MainActivity extends Activity {
    private WebView mWebView;
    private myJsInterface mJsInterface;
    private static final int RC_BARCODE_CAPTURE = 9001;
    private static final String TAG = "BarcodeMain";


    @SuppressLint({"SetJavaScriptEnabled", "ApplySharedPref"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        SharedPreferences sharedPref = this.getPreferences(Context.MODE_PRIVATE);
        String savedHash = sharedPref.getString(getString(R.string.saved_hash), "");

        mWebView = (WebView) findViewById(R.id.jsWalletWebView);
        this.mJsInterface = new myJsInterface(this, mWebView);
        mWebView.addJavascriptInterface(this.mJsInterface, "Android");
        mWebView.setBackgroundColor(Color.TRANSPARENT);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        mWebView.loadUrl("file:///android_asset/web/index.html#" + savedHash);
        mWebView.setVisibility(View.GONE);

        final Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                mWebView.setVisibility(View.VISIBLE);
            }
        }, 2000);

    }

    public void switchActivity() {
        Intent intent = new Intent(this, BarcodeScannerActivity.class);
        startActivityForResult(intent, RC_BARCODE_CAPTURE);
        intent.putExtra(BarcodeScannerActivity.AutoFocus, true);
        intent.putExtra(BarcodeScannerActivity.UseFlash, true);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == RC_BARCODE_CAPTURE) {
            if (resultCode == CommonStatusCodes.SUCCESS) {
                if (data != null) {
                    Barcode barcode = data.getParcelableExtra(BarcodeScannerActivity.BarcodeObject);
//                    statusMessage.setText("Barcode Success");
//                    barcodeValue.setText(barcode.displayValue);
                    Toast.makeText(this, barcode.displayValue, Toast.LENGTH_LONG).show();
                    Log.d(TAG, "Barcode read: " + barcode.displayValue);

                    this.mJsInterface.jsFnCall("setQr", barcode.displayValue);
                } else {
                    Toast.makeText(this, "Barcode Failed!", Toast.LENGTH_LONG).show();
                    Log.d(TAG, "No barcode captured, intent data is null");
                }
            } else {
                /*statusMessage.setText(String.format("Barcode Error",
                        CommonStatusCodes.getStatusCodeString(resultCode)));*/
                Toast.makeText(this, "Barcode error!", Toast.LENGTH_LONG).show();
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }


}
