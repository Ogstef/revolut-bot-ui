import { useQuery } from '@tanstack/react-query';
import { fetchIntervals } from '../api/intervals';

export function useIntervals() {
  return useQuery({
    queryKey: ['intervals'],
    queryFn: fetchIntervals,
    staleTime: Infinity,
    retry: false,
  });
}
