import { requireOptionalNativeModule } from 'expo';

type SmsGuardNative = {
  readonly taskName: string;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  /** Returns false when notifications are not allowed. */
  showWarning(scanId: string, title: string, body: string, channelName: string): boolean;
};

/** Kotlin module in modules/sms-guard. Android only; null on other platforms. */
export const SmsGuard = requireOptionalNativeModule<SmsGuardNative>('SmsGuard');

/** Must match SmsGuardTaskService.TASK_NAME. */
export const SMS_GUARD_TASK = 'BaitlessSmsGuard';
