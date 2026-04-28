import { request } from './client';
import type {
  BacktestRequest,
  BacktestRunDetail,
  BacktestRunSummary,
  StrategyName,
  WalkForwardResult,
} from './client';

export const runBacktest = (req: BacktestRequest) =>
  request<BacktestRunDetail>('/api/backtest/run', {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const runWalkForward = (req: BacktestRequest, windows: number = 3) =>
  request<WalkForwardResult>('/api/backtest/walk-forward', {
    method: 'POST',
    body: JSON.stringify({ request: req, windows }),
  });

export const fetchBacktestRuns = (filter?: {
  pair?: string;
  strategy?: StrategyName;
  interval?: string;
  limit?: number;
}) => {
  const parts: string[] = [];
  if (filter?.pair) parts.push(`pair=${encodeURIComponent(filter.pair)}`);
  if (filter?.strategy) parts.push(`strategy=${filter.strategy}`);
  if (filter?.interval) parts.push(`interval=${encodeURIComponent(filter.interval)}`);
  if (filter?.limit) parts.push(`limit=${filter.limit}`);
  const qs = parts.length ? `?${parts.join('&')}` : '';
  return request<BacktestRunSummary[]>(`/api/backtest/runs${qs}`);
};

export const fetchBacktestRun = (id: string) =>
  request<BacktestRunDetail>(`/api/backtest/runs/${id}`);

export const deleteBacktestRun = (id: string) =>
  request<void>(`/api/backtest/runs/${id}`, { method: 'DELETE' });

export const patchBacktestRun = (id: string, patch: { label?: string; notes?: string }) =>
  request<BacktestRunSummary>(`/api/backtest/runs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
