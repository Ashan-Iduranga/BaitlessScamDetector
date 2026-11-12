import type { InputType } from '@baitless/detector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';

import { saveScan } from '@/features/history/repo';
import { historyKeys } from '@/features/history/hooks';
import { currentLanguage } from '@/lib/i18n';

import { runScan } from './run-scan';

/** Runs a scan, saves it to history and opens the result screen. */
export function useScan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, inputType }: { text: string; inputType: InputType }) => {
      const outcome = await runScan({ text, inputType, language: currentLanguage() });
      const id = randomUUID();
      saveScan({ id, createdAt: Date.now(), inputType, text: text.trim(), report: outcome.report });
      return { id, fallback: outcome.fallback };
    },
    onSuccess: ({ id, fallback }) => {
      client.invalidateQueries({ queryKey: historyKeys.all });
      router.push({ pathname: '/result/[id]', params: { id, fallback: fallback ?? '' } });
    },
  });
}
