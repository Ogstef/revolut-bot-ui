import { useQuery } from '@tanstack/react-query';
import { fetchPairs } from '../api/pairs';

export function usePairs() {
  return useQuery({
    queryKey: ['pairs'],
    queryFn: fetchPairs,
    staleTime: Infinity,
    retry: false,
  });
}
