package expo.modules.smsguard

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Posts Baitless warnings: SMS Guard ("possible scam SMS") and Scam Radar ("new scam spreading").
 * Tapping one opens [url], a baitless:// deep link handled by Expo Router.
 */
internal object WarningNotifier {
  /** Returns false when the user has not allowed notifications. */
  fun show(
    context: Context,
    key: String,
    title: String,
    body: String,
    channelId: String,
    channelName: String,
    url: String,
  ): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return false
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH)
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    val open = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    val pending = PendingIntent.getActivity(
      context,
      key.hashCode(),
      open,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(R.drawable.sms_guard_notification)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
      .setContentIntent(pending)
      .setAutoCancel(true)
      .build()

    NotificationManagerCompat.from(context).notify(key.hashCode(), notification)
    return true
  }
}
