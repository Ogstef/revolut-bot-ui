import { useQuery } from '@tanstack/react-query';
import { fetchBacktestRuns } from '../api/backtest';
import type { StrategyName } from '../api/client';

interface Filter {
  pair?: string;
  strategy?: StrategyName;
  interval?: string;
  limit?: number;
}

export function useBacktestRuns(filter: Filter = {}) {
  return useQuery({
    queryKey: ['backtest-runs', filter],
    queryFn: () => fetchBacktestRuns(filter),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
