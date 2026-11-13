package expo.modules.smsguard

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsGuardModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SmsGuard")

    Constant("taskName") { SmsGuardTaskService.TASK_NAME }

    Function("isEnabled") { SmsGuardPrefs.isEnabled(context) }

    Function("setEnabled") { enabled: Boolean -> SmsGuardPrefs.setEnabled(context, enabled) }

    // SMS Guard warning: opens the saved result (src/app/result/[id].tsx).
    Function("showWarning") { scanId: String, title: String, body: String, channelName: String ->
      WarningNotifier.show(
        context, scanId, title, body, "sms_guard_warnings", channelName, "baitless://result/$scanId",
      )
    }

    // Any other Baitless alert (Scam Radar). [url] must be a baitless:// link.
    Function("showAlert") {
        key: String, title: String, body: String, channelId: String, channelName: String, url: String ->
      require(url.startsWith("baitless://")) { "Alerts may only open Baitless" }
      WarningNotifier.show(context, key, title, body, channelId, channelName, url)
    }
  }
}
