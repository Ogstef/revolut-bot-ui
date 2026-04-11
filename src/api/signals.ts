import { request } from './client';
import type { StrategyName, SignalSummary, Signal } from './client';

export const fetchSignalSummary = (pair: string) =>
  request<SignalSummary[]>(`/api/signals/summary?pair=${encodeURIComponent(pair)}`);

export const fetchStrategySignals = (name: StrategyName, pair: string, limit = 20) =>
  request<Signal[]>(`/api/strategies/${name}/signals?pair=${encodeURIComponent(pair)}&limit=${limit}`);
