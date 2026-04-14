import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/history';
import type { StrategyName } from '../api/client';

export function useHistory(
  name: StrategyName | undefined,
  pair: string,
  interval?: string,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: ['history', name, pair, interval, from, to],
    queryFn:  () => fetchHistory(name!, pair, interval, from, to),
    enabled:  !!name,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
