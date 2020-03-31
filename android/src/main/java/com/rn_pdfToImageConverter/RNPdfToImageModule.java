package com.RNPdfToImageConverter;

import android.widget.Toast;
import android.net.Uri;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;

import java.io.File;
import java.io.FileOutputStream;

public class RNPdfToImageModule extends ReactContextBaseJavaModule {

  private static final String E_CONVERT_ERROR = "E_CONVERT_ERROR";

  private final ReactApplicationContext reactContext;

  public RNPdfToImageModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNPdfToImage";
  }

  @ReactMethod
  public void convert(String pdfUriString, Promise promise) {
    try {
        WritableMap map = Arguments.createMap();
        WritableArray files = Arguments.createArray();
        Uri path = Uri.parse(pdfUriString);

        ParcelFileDescriptor parcelFileDescriptor = reactContext.getContentResolver().openFileDescriptor(path, "r");

        PdfRenderer renderer = new PdfRenderer(parcelFileDescriptor);
        
        final int pageCount = renderer.getPageCount();

        for (int i = 0; i < pageCount; i++) {
            PdfRenderer.Page page = renderer.openPage(i);

            Bitmap bitmap = Bitmap.createBitmap(page.getWidth(), page.getHeight(), Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            canvas.drawColor(Color.WHITE);

            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            File output = this.saveImage(bitmap, reactContext.getCacheDir());
            page.close();

            files.pushString(output.getAbsolutePath());
        }   

        map.putArray("outputFiles", files);

        promise.resolve(map);

        renderer.close();

    } catch(Exception e) {
        promise.reject(E_CONVERT_ERROR, e);
    }
  }

  private File saveImage(Bitmap finalBitmap, File cacheDir) {
    File file = new File(cacheDir.getAbsolutePath() + File.separator + System.currentTimeMillis() + "_pdf.png");
    if (file.exists()) file.delete ();
    try {
        FileOutputStream out = new FileOutputStream(file);
        finalBitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
        out.flush();
        out.close();
    } catch (Exception e) {
        e.printStackTrace();
        return null;
    }
    return file;
  }
}