import { ScamCategory } from '@baitless/detector';
import { z } from 'zod';

import { ensureSession, supabase } from '@/lib/supabase';

export const radarKeys = { summary: ['radar'] as const };

const Count = z.number().int().nonnegative();

const TrendingScamSchema = z.object({
  kind: z.enum(['domain', 'url']),
  value: z.string(),
  reportCount: Count,
  firstSeen: z.string(),
  lastSeen: z.string(),
  /** When the third person reported it. */
  confirmedAt: z.string().nullable(),
  category: ScamCategory.nullable(),
});
export type TrendingScam = z.infer<typeof TrendingScamSchema>;

const RadarSummarySchema = z.object({
  generatedAt: z.string(),
  thisWeek: Count,
  lastWeek: Count,
  confirmedTotal: Count,
  /** Last 14 days in Sri Lanka time, oldest first, every day present. */
  daily: z.array(z.object({ day: z.string(), count: Count })),
  /** Last 30 days, most reported first. */
  categories: z.array(z.object({ category: ScamCategory, count: Count })),
  trending: z.array(TrendingScamSchema),
});
export type RadarSummary = z.infer<typeof RadarSummarySchema>;

/** Totals and confirmed scam links only (see supabase/migrations/*_radar_summary.sql). */
export async function fetchRadar(): Promise<RadarSummary> {
  await ensureSession();
  const { data, error } = await supabase.rpc('radar_summary');
  if (error) throw error;
  return RadarSummarySchema.parse(data);
}

export const hasRadarData = (s: RadarSummary) =>
  s.thisWeek + s.lastWeek > 0 || s.categories.length > 0 || s.trending.length > 0;
