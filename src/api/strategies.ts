import { request } from './client';
import type { StrategyName, StrategyInfo, Position, Trade, Stats, PnlBreakdown, ConfigUpdate } from './client';

export const fetchStrategies = (pair: string) =>
  request<StrategyInfo[]>(`/api/strategies?pair=${encodeURIComponent(pair)}`);

export const fetchPositions = (name: StrategyName, pair: string) =>
  request<Position[]>(`/api/strategies/${name}/positions?pair=${encodeURIComponent(pair)}`);

export const fetchTrades = (name: StrategyName, pair: string, limit = 50) =>
  request<Trade[]>(`/api/strategies/${name}/trades?pair=${encodeURIComponent(pair)}&limit=${limit}`);

export const fetchStats = (name: StrategyName, pair: string) =>
  request<Stats>(`/api/strategies/${name}/stats?pair=${encodeURIComponent(pair)}`);

export const fetchPnl = (name: StrategyName, pair: string) =>
  request<PnlBreakdown>(`/api/strategies/${name}/pnl?pair=${encodeURIComponent(pair)}`);

export const updateConfig = (cfg: ConfigUpdate) =>
  request<string>('/api/config', { method: 'POST', body: JSON.stringify(cfg) });
