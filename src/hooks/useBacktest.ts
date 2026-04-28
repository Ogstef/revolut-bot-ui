import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runBacktest, runWalkForward } from '../api/backtest';
import type { BacktestRequest } from '../api/client';

/** Single backtest mutation. Invalidates the runs list on success. */
export function useBacktest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BacktestRequest) => runBacktest(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest-runs'] });
    },
  });
}

/** Walk-forward mutation — splits a date range into N sub-windows. */
export function useWalkForward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ req, windows }: { req: BacktestRequest; windows: number }) =>
      runWalkForward(req, windows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest-runs'] });
    },
  });
}
