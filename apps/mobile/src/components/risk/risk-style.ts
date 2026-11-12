import type { RiskLevel } from '@baitless/detector';
import { ShieldCheck, ShieldWarning, Warning, type Icon } from 'phosphor-react-native';

/** Risk is always shown with colour + icon + text (never colour alone). */
export const RISK_STYLE: Record<
  RiskLevel,
  {
    icon: Icon;
    container: string;
    onContainer: string;
    accent: string;
    text: string;
    colorVar: string;
  }
> = {
  safe: {
    icon: ShieldCheck,
    text: 'text-safe',
    container: 'bg-safe-container',
    onContainer: 'text-on-safe-container',
    accent: 'border-safe',
    colorVar: '--color-safe',
  },
  caution: {
    icon: Warning,
    text: 'text-caution',
    container: 'bg-caution-container',
    onContainer: 'text-on-caution-container',
    accent: 'border-caution',
    colorVar: '--color-caution',
  },
  danger: {
    icon: ShieldWarning,
    text: 'text-danger',
    container: 'bg-danger-container',
    onContainer: 'text-on-danger-container',
    accent: 'border-danger',
    colorVar: '--color-danger',
  },
};
