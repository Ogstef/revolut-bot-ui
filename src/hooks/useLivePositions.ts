import { useQuery } from '@tanstack/react-query';
import { fetchLivePositions } from '../api/positions';
import { usePair } from '../context/PairContext';

export function useLivePositions() {
  const { selectedVehicle } = usePair();
  return useQuery({
    queryKey: ['live-positions', selectedVehicle],
    queryFn: () => fetchLivePositions(selectedVehicle),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
