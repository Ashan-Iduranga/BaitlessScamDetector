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

    Function("showWarning") { scanId: String, title: String, body: String, channelName: String ->
      WarningNotifier.show(context, scanId, title, body, channelName)
    }
  }
}
