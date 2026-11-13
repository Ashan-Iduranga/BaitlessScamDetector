import { requireOptionalNativeModule } from 'expo';

type SmsGuardNative = {
  readonly taskName: string;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  /** Returns false when notifications are not allowed. */
  showWarning(scanId: string, title: string, body: string, channelName: string): boolean;
  /** Generic Baitless notification (Scam Radar). `url` must start with baitless://. */
  showAlert(
    key: string,
    title: string,
    body: string,
    channelId: string,
    channelName: string,
    url: string,
  ): boolean;
};

/** Kotlin module in modules/sms-guard (also posts Scam Radar alerts). Android only; null elsewhere. */
export const SmsGuard = requireOptionalNativeModule<SmsGuardNative>('SmsGuard');

/** Must match SmsGuardTaskService.TASK_NAME. */
export const SMS_GUARD_TASK = 'BaitlessSmsGuard';
