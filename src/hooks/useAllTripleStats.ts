import { useQuery } from '@tanstack/react-query';
import { fetchAllTripleStats } from '../api/strategies';

export function useAllTripleStats() {
  return useQuery({
    queryKey: ['all-triple-stats'],
    queryFn: () => fetchAllTripleStats(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
