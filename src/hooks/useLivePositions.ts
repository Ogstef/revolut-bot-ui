import { useQuery } from '@tanstack/react-query';
import { fetchLivePositions } from '../api/positions';

export function useLivePositions() {
  return useQuery({
    queryKey: ['live-positions'],
    queryFn: () => fetchLivePositions(),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
