import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/history';
import { usePair } from '../context/PairContext';
import type { StrategyName } from '../api/client';

export function useHistory(
  name: StrategyName | undefined,
  pair: string,
  interval?: string,
  from?: string,
  to?: string,
) {
  const { selectedVehicle } = usePair();
  return useQuery({
    queryKey: ['history', name, pair, interval, from, to, selectedVehicle],
    queryFn:  () => fetchHistory(name!, pair, interval, from, to, selectedVehicle),
    enabled:  !!name,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
