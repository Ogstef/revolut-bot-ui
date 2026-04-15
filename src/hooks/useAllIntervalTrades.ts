import { useQueries } from '@tanstack/react-query';
import { fetchTrades } from '../api/strategies';
import type { StrategyName } from '../api/client';

export function useAllIntervalTrades(pair: string, strategy: StrategyName, intervals: string[]) {
  const results = useQueries({
    queries: intervals.map(iv => ({
      queryKey: ['trades', strategy, pair, iv],
      queryFn: () => fetchTrades(strategy, pair, 500, iv),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((query, i) => ({ interval: intervals[i], query }));
}
