import { useQuery } from '@tanstack/react-query';
import { fetchCurrentSignals } from '../api/signals';

export function useCurrentSignals() {
  return useQuery({
    queryKey: ['current-signals'],
    queryFn: () => fetchCurrentSignals(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
