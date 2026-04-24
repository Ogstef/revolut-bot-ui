import { useQuery } from '@tanstack/react-query';
import { fetchAllTripleStats } from '../api/strategies';
import { usePair } from '../context/PairContext';

export function useAllTripleStats() {
  const { selectedVehicle } = usePair();
  return useQuery({
    queryKey: ['all-triple-stats', selectedVehicle],
    queryFn: () => fetchAllTripleStats(selectedVehicle),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
