import { useQuery } from '@tanstack/react-query';
import { fetchFearGreed } from '../api/fearGreed';

export function useFearGreed() {
  return useQuery({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    refetchInterval: 5 * 60 * 1000, // 5 min — index only changes daily
    refetchIntervalInBackground: false,
    retry: false,
  });
}
