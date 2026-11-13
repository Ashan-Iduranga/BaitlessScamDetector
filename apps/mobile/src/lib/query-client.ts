import { QueryClient } from '@tanstack/react-query';

/** Shared so background work (SMS Guard) can refresh lists the app is showing. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: false } },
});
