import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteAllScans, getScan, listScans } from './repo';

export const historyKeys = {
  all: ['scans'] as const,
  one: (id: string) => ['scans', id] as const,
};

export function useScanHistory() {
  return useQuery({ queryKey: historyKeys.all, queryFn: () => listScans() });
}

export function useScan(id: string) {
  return useQuery({ queryKey: historyKeys.one(id), queryFn: () => getScan(id) });
}

export function useClearHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => deleteAllScans(),
    onSuccess: () => client.invalidateQueries({ queryKey: historyKeys.all }),
  });
}
