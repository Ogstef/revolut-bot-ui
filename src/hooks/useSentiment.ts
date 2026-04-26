import { useQuery } from '@tanstack/react-query';
import { fetchSentiment } from '../api/sentiment';
import type { SentimentSource } from '../api/client';

/**
 * Windowed sentiment aggregate for (pair, source). Refetches every 2 min
 * — the backing DB aggregate itself has a 60s in-memory cache, so 2 min
 * is the first tier at which new data is guaranteed.
 */
export function useSentiment(pair: string, source: SentimentSource = 'COMBINED', interval?: string) {
  return useQuery({
    queryKey: ['sentiment', pair, source, interval ?? 'default'],
    queryFn: () => fetchSentiment(pair, source, interval),
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
