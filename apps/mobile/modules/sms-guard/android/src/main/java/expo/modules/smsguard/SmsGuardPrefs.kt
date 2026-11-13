package expo.modules.smsguard

import android.content.Context

/** The on/off switch lives in native storage so the SMS receiver can read it without starting JS. */
internal object SmsGuardPrefs {
  private const val FILE = "baitless_sms_guard"
  private const val KEY_ENABLED = "enabled"

  fun isEnabled(context: Context): Boolean =
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_ENABLED, enabled)
      .apply()
  }
}
