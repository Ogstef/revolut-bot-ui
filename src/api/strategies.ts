import { request } from './client';
import type { StrategyName, StrategyInfo, Position, Trade, Stats, PnlBreakdown, ConfigUpdate, TripleStats } from './client';

function qs(pair: string, interval?: string, extra?: Record<string, string | number>): string {
  const parts: string[] = [`pair=${encodeURIComponent(pair)}`];
  if (interval) parts.push(`interval=${encodeURIComponent(interval)}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${encodeURIComponent(String(v))}`);
  }
  return parts.join('&');
}

export const fetchStrategies = (pair: string, interval?: string) =>
  request<StrategyInfo[]>(`/api/strategies?${qs(pair, interval)}`);

export const fetchPositions = (name: StrategyName, pair: string, interval?: string) =>
  request<Position[]>(`/api/strategies/${name}/positions?${qs(pair, interval)}`);

export const fetchTrades = (name: StrategyName, pair: string, limit = 50, interval?: string) =>
  request<Trade[]>(`/api/strategies/${name}/trades?${qs(pair, interval, { limit })}`);

export const fetchStats = (name: StrategyName, pair: string, interval?: string) =>
  request<Stats>(`/api/strategies/${name}/stats?${qs(pair, interval)}`);

export const fetchPnl = (name: StrategyName, pair: string, interval?: string) =>
  request<PnlBreakdown>(`/api/strategies/${name}/pnl?${qs(pair, interval)}`);

export const fetchAllTripleStats = () =>
  request<TripleStats[]>(`/api/stats/all-triples`);

export const updateConfig = (cfg: ConfigUpdate) =>
  request<string>('/api/config', { method: 'POST', body: JSON.stringify(cfg) });
