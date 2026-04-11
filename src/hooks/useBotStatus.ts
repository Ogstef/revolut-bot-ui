import { useQuery } from '@tanstack/react-query';
import { fetchStatus } from '../api/status';

export function useBotStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
