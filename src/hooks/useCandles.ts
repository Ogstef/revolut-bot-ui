import { useQuery } from '@tanstack/react-query';
import { fetchCandles } from '../api/candles';
import { usePair } from '../context/PairContext';

export function useCandles(limit = 500) {
  const { selectedPair, selectedInterval } = usePair();
  return useQuery({
    queryKey: ['candles', selectedPair, selectedInterval, limit],
    queryFn:  () => fetchCandles(selectedPair, selectedInterval, limit),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
