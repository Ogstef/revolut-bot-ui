import { useQuery } from '@tanstack/react-query';
import { fetchToday } from '../api/today';

export function useToday() {
  return useQuery({
    queryKey: ['today'],
    queryFn: fetchToday,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
