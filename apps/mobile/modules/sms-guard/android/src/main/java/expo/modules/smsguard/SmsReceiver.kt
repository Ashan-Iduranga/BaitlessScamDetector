package expo.modules.smsguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.facebook.react.HeadlessJsTaskService

/**
 * Called by Android for every incoming SMS. When the user has turned SMS Guard on, it hands the
 * message to the JS check ([SmsGuardTaskService]). Nothing is stored here.
 */
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    if (!SmsGuardPrefs.isEnabled(context)) return

    val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    // A long SMS arrives in several parts: join them per sender.
    val bodies = linkedMapOf<String, StringBuilder>()
    var receivedAt = System.currentTimeMillis()
    for (part in parts) {
      if (part == null) continue
      bodies.getOrPut(part.displayOriginatingAddress.orEmpty()) { StringBuilder() }
        .append(part.displayMessageBody.orEmpty())
      receivedAt = part.timestampMillis
    }

    for ((sender, body) in bodies) {
      if (body.isBlank()) continue
      val task = Intent(context, SmsGuardTaskService::class.java)
        .putExtra("sender", sender)
        .putExtra("body", body.toString())
        .putExtra("receivedAt", receivedAt.toDouble())
      try {
        // Receiving an SMS briefly allows the app to start a service from the background.
        context.startService(task)
        HeadlessJsTaskService.acquireWakeLockNow(context)
      } catch (e: IllegalStateException) {
        Log.w(TAG, "Could not start the SMS check", e)
      }
    }
  }

  private companion object {
    const val TAG = "BaitlessSmsGuard"
  }
}
