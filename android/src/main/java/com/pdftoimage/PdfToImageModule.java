package com.pdftoimage;

import androidx.annotation.NonNull;

import android.widget.Toast;
import android.net.Uri;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;

import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.ConnectException;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.Base64;

@ReactModule(name = PdfToImageModule.NAME)
public class PdfToImageModule extends ReactContextBaseJavaModule {
  private ReactApplicationContext context;

  public static final String NAME = "PdfToImage";

  private static final String E_CONVERT_ERROR = "E_CONVERT_ERROR";

  private static final String TAG = "PdfToImage";

  public PdfToImageModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  @ReactMethod
      public void printPDF(String ipAddress, Integer portNumber, String pdfBase64String, Promise promise) {
          DataOutputStream outToServer = null;
          Socket clientSocket;
          try {
              File cacheDir = this.context.getCacheDir();
              File file = File.createTempFile("pdfToImage", "pdf", cacheDir);
              file.setWritable(true);
              FileOutputStream fos = new FileOutputStream(file);
              byte[] decoder = Base64.getDecoder().decode(pdfBase64String);
              fos.write(decoder);


              FileInputStream fileInputStream = new FileInputStream(file);
              InputStream is = fileInputStream;
              clientSocket = new Socket(ipAddress, portNumber);
              outToServer = new DataOutputStream(clientSocket.getOutputStream());
              byte[] buffer = new byte[3000];
              while (is.read(buffer) != -1) {
                  outToServer.write(buffer);
              }
              outToServer.flush();
              promise.resolve(1);
          } catch (ConnectException connectException) {
              Log.e(TAG, connectException.toString(), connectException);
              promise.reject(connectException.toString(), connectException.getLocalizedMessage());
          } catch (UnknownHostException e1) {
              Log.e(TAG, e1.toString(), e1);
              promise.reject(e1.toString(), e1.getLocalizedMessage());
          } catch (IOException e1) {
              Log.e(TAG, e1.toString(), e1);
              promise.reject(e1.toString(), e1.getLocalizedMessage());
          }
      }

      @ReactMethod
      public void convertB64(String base64String, int dpi, Promise promise) {
          try {
              WritableMap map = Arguments.createMap();
              WritableArray files = Arguments.createArray();

              File cacheDir = this.context.getCacheDir();
              File file = File.createTempFile("pdfToImage", "pdf", cacheDir);
              file.setWritable(true);
              FileOutputStream fos = new FileOutputStream(file);
              byte[] decoder = Base64.getDecoder().decode(base64String);
              fos.write(decoder);

              ParcelFileDescriptor parcelFileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);

              PdfRenderer renderer = new PdfRenderer(parcelFileDescriptor);

              final int pageCount = renderer.getPageCount();

              for (int i = 0; i < pageCount; i++) {
                  PdfRenderer.Page page = renderer.openPage(i);

                  Bitmap bitmap = Bitmap.createBitmap(dpi, dpi * page.getHeight() / page.getWidth(), Bitmap.Config.ARGB_8888);
                  Canvas canvas = new Canvas(bitmap);
                  canvas.drawColor(Color.WHITE);

                  page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
                  File output = this.saveImage(bitmap, this.context.getCacheDir());
                  page.close();

                  files.pushString(output.getAbsolutePath());
              }

              map.putArray("outputFiles", files);

              promise.resolve(map);

              renderer.close();

              file.delete();

          } catch (Exception e) {
              promise.reject(E_CONVERT_ERROR, e);
          }
      }

      @ReactMethod
      public void convert(String pdfUriString, Promise promise) {
          try {
              WritableMap map = Arguments.createMap();
              WritableArray files = Arguments.createArray();
              Uri path = Uri.parse(pdfUriString);

              ParcelFileDescriptor parcelFileDescriptor = this.context.getContentResolver().openFileDescriptor(path, "r");

              PdfRenderer renderer = new PdfRenderer(parcelFileDescriptor);

              final int pageCount = renderer.getPageCount();

              for (int i = 0; i < pageCount; i++) {
                  PdfRenderer.Page page = renderer.openPage(i);

                  Bitmap bitmap = Bitmap.createBitmap(page.getWidth(), page.getHeight(), Bitmap.Config.ARGB_8888);
                  Canvas canvas = new Canvas(bitmap);
                  canvas.drawColor(Color.WHITE);

                  page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                  File output = this.saveImage(bitmap, this.context.getCacheDir());
                  page.close();

                  files.pushString(output.getAbsolutePath());
              }

              map.putArray("outputFiles", files);

              promise.resolve(map);

              renderer.close();

          } catch (Exception e) {
              promise.reject(E_CONVERT_ERROR, e);
          }
      }

      private File saveImage(Bitmap finalBitmap, File cacheDir) {
          File file = new File(cacheDir.getAbsolutePath() + File.separator + System.currentTimeMillis() + "_pdf.png");
          if (file.exists()) file.delete();
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
