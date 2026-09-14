// AndroidNfcBridge.java
// Minimal Android NFC bridge skeleton for NTAG216 reads/writes.
// Place in your Android module and wire to UE via JNI or to your Unity/Native layer.
package com.aura.nfc;
import android.app.Activity;
import android.content.Intent;
import android.nfc.NdefMessage;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.NfcA;
import android.os.Parcelable;
import android.util.Base64;
import android.util.Log;
import java.io.IOException;
import java.security.MessageDigest;
public class AndroidNfcBridge {
private static final String TAG = "AndroidNfcBridge";
private Activity activity;
private NfcAdapter nfcAdapter;
public AndroidNfcBridge(Activity activity) {
this.activity = activity;
this.nfcAdapter = NfcAdapter.getDefaultAdapter(activity);
}
public void startListening() {
// Setup foreground dispatch in Activity (not shown)
}
public void stopListening() {
// Disable foreground dispatch
}
// Call from Activity.onNewIntent(intent)
public void handleIntent(Intent intent, NfcReadCallback callback) {
String action = intent.getAction();
if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(action) ||
NfcAdapter.ACTION_TECH_DISCOVERED.equals(action) ||
NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)) {
Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
if (tag == null) return;
byte[] uid = tag.getId();
String uidHex = bytesToHex(uid);
// Read raw memory pages using NfcA (NTAG)
try {
NfcA nfcA = NfcA.get(tag);
nfcA.connect();
byte[] snapshot = readNtagMemory(nfcA);
nfcA.close();
String snapshotBase64 = Base64.encodeToString(snapshot, Base64.NO_WRAP);
String checksum = sha256Base64(snapshot);
callback.onRead(uidHex, snapshotBase64, checksum);
} catch (IOException e) {
Log.e(TAG, "NFC read error", e);
callback.onError(e.getMessage());
}
}
}
private byte[] readNtagMemory(NfcA nfcA) throws IOException {
// NTAG read implementation: read multiple pages (4 bytes per page)
// This is a simplified example; production must handle page ranges and errors.
int pagesToRead = 225; // NTAG216 has 888 bytes -> 222 pages (approx)
byte[] buffer = new byte[pagesToRead * 4];
int offset = 0;
for (int p = 0; p < pagesToRead; p += 4) {
// READ command (0x30) reads 4 pages starting at page p
byte[] cmd = new byte[] { (byte)0x30, (byte)p };
byte[] resp = nfcA.transceive(cmd);
System.arraycopy(resp, 0, buffer, offset, resp.length);
offset += resp.length;
}
return buffer;
}
private String sha256Base64(byte[] data) {
try {
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] digest = md.digest(data);
return Base64.encodeToString(digest, Base64.NO_WRAP);
} catch (Exception e) {
return "";
}
}
private String bytesToHex(byte[] bytes) {
StringBuilder sb = new StringBuilder();
for (byte b : bytes) sb.append(String.format("%02X", b));
return sb.toString();
}
public interface NfcReadCallback {
void onRead(String uidHex, String snapshotBase64, String checksum);
void onError(String message);
}
}
