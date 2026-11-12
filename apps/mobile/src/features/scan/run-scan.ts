import {
  AiResult,
  analyzeText,
  buildReport,
  maskPii,
  type InputType,
  type Language,
  type RiskReport,
  type ServerSignals,
} from '@baitless/detector';
import { z } from 'zod';

import { ensureSession, supabase } from '@/lib/supabase';

/**
 * Server budget. Past this we show the on-device result instead of making people wait.
 * The server gives Gemini 6.5 s (it is often slow on the free tier); the rest covers sign-in,
 * the network and a cold start.
 */
const SERVER_TIMEOUT_MS = 9000;

const ServerResponse = z.object({
  ai: AiResult.nullable(),
  unsafeUrls: z.array(z.string()),
  communityHits: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});

export type ScanOutcome = {
  report: RiskReport;
  /** Why the server part was skipped, if it was. */
  fallback: 'offline' | 'server_busy' | null;
};

export async function runScan(input: {
  text: string;
  inputType: InputType;
  language: Language;
}): Promise<ScanOutcome> {
  const text = input.text.trim();
  const rules = analyzeText(text);

  let server: ServerSignals | null = null;
  let fallback: ScanOutcome['fallback'] = null;
  try {
    server = await withTimeout(askServer(text, rules.urls, input.language), SERVER_TIMEOUT_MS);
  } catch (e) {
    fallback = isNetworkError(e) ? 'offline' : 'server_busy';
    if (__DEV__) console.warn('analyze failed, using on-device result', e);
  }

  return { report: buildReport(rules, server), fallback };
}

async function askServer(text: string, urls: string[], language: Language): Promise<ServerSignals> {
  await ensureSession();
  // Personal details never leave the phone. Links stay, for the Safe Browsing check.
  const { masked } = maskPii(text);
  const { data, error } = await supabase.functions.invoke('analyze', {
    body: { text: masked, urls: urls.slice(0, 10), language },
  });
  if (error) throw error;
  const parsed = ServerResponse.parse(data);
  return { ai: parsed.ai, unsafeUrls: parsed.unsafeUrls, communityHits: parsed.communityHits };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function isNetworkError(e: unknown): boolean {
  const name = (e as { name?: string })?.name ?? '';
  const message = String((e as { message?: string })?.message ?? '');
  return name === 'FunctionsFetchError' || /network request failed|fetch failed/i.test(message);
}
