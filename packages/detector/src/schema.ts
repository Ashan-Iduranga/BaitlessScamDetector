import { z } from 'zod';

/**
 * Shared contracts for the detection pipeline. The app, the `analyze` Edge Function and the
 * LLM's structured output are all validated against these schemas.
 */

export const Language = z.enum(['en', 'si', 'ta']);
export type Language = z.infer<typeof Language>;

export const ScamCategory = z.enum([
  'bank',
  'lottery_prize',
  'courier',
  'job',
  'investment',
  'telecom',
  'government',
  'romance',
  'shopping',
  'other',
  'none',
]);
export type ScamCategory = z.infer<typeof ScamCategory>;

export const RiskLevel = z.enum(['safe', 'caution', 'danger']);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const InputType = z.enum(['paste', 'share', 'screenshot', 'sms']);
export type InputType = z.infer<typeof InputType>;

export const ScanInput = z.object({
  text: z.string().min(1).max(5000),
  inputType: InputType,
  language: Language,
});
export type ScanInput = z.infer<typeof ScanInput>;

/** A highlighted part of the original message that explains the score. */
export const RedFlag = z.object({
  ruleId: z.string(),
  /** Character offsets into the original text, end exclusive. */
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  reason: z.string(),
});
export type RedFlag = z.infer<typeof RedFlag>;

export const RuleResult = z.object({
  score: z.number().min(0).max(100),
  category: ScamCategory,
  flags: z.array(RedFlag),
  urls: z.array(z.string()),
  phoneNumbers: z.array(z.string()),
});
export type RuleResult = z.infer<typeof RuleResult>;

/** What the LLM must return. Kept small so it fits a strict JSON schema. */
export const AiResult = z.object({
  isScam: z.boolean(),
  confidence: z.number().min(0).max(1),
  category: ScamCategory,
  redFlagPhrases: z.array(z.string()).max(10),
  explanation: z.string().max(800),
  recommendedAction: z.string().max(300),
});
export type AiResult = z.infer<typeof AiResult>;

export const RiskReport = z.object({
  score: z.number().min(0).max(100),
  level: RiskLevel,
  category: ScamCategory,
  flags: z.array(RedFlag),
  explanation: z.string(),
  recommendedAction: z.string(),
  /** True when only the on-device rules ran (offline or server error). */
  offline: z.boolean(),
  sources: z.object({
    rules: z.boolean(),
    safeBrowsing: z.boolean(),
    community: z.boolean(),
    ai: z.boolean(),
  }),
});
export type RiskReport = z.infer<typeof RiskReport>;

/** Score bands. Thresholds will be tuned against the dataset in Phase 1. */
export function levelForScore(score: number): RiskLevel {
  if (score >= 70) return 'danger';
  if (score >= 35) return 'caution';
  return 'safe';
}
