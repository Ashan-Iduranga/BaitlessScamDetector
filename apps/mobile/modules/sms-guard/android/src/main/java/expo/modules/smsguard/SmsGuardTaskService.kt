package expo.modules.smsguard

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/** Runs the JS task registered as [TASK_NAME] in src/features/sms-guard/register.ts. */
class SmsGuardTaskService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val extras = intent?.extras ?: return null
    return HeadlessJsTaskConfig(
      TASK_NAME,
      Arguments.fromBundle(extras),
      TIMEOUT_MS,
      // Also check SMS that arrive while the app is open.
      true,
    )
  }

  companion object {
    const val TASK_NAME = "BaitlessSmsGuard"
    private const val TIMEOUT_MS = 20_000L
  }
}
