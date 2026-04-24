import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '../api/vehicles';

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    staleTime: Infinity,
    retry: false,
  });
}
