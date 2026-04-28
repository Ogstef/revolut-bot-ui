import { useQuery } from '@tanstack/react-query';
import { fetchBacktestRun } from '../api/backtest';

/** Detail of a single backtest run; cached by id, no polling. */
export function useBacktestRun(id: string | null) {
  return useQuery({
    queryKey: ['backtest-run', id],
    queryFn: () => fetchBacktestRun(id as string),
    enabled: id != null,
    staleTime: Infinity,
  });
}
