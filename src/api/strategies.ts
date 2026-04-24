import { request } from './client';
import type { StrategyName, StrategyInfo, Position, Trade, Stats, PnlBreakdown, ConfigUpdate, TripleStats, TradingVehicle } from './client';

function qs(pair: string, interval?: string, vehicle?: TradingVehicle, extra?: Record<string, string | number>): string {
  const parts: string[] = [`pair=${encodeURIComponent(pair)}`];
  if (interval) parts.push(`interval=${encodeURIComponent(interval)}`);
  if (vehicle)  parts.push(`vehicle=${encodeURIComponent(vehicle)}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${encodeURIComponent(String(v))}`);
  }
  return parts.join('&');
}

export const fetchStrategies = (pair: string, interval?: string, vehicle?: TradingVehicle) =>
  request<StrategyInfo[]>(`/api/strategies?${qs(pair, interval, vehicle)}`);

export const fetchPositions = (name: StrategyName, pair: string, interval?: string, vehicle?: TradingVehicle) =>
  request<Position[]>(`/api/strategies/${name}/positions?${qs(pair, interval, vehicle)}`);

export const fetchTrades = (name: StrategyName, pair: string, limit = 50, interval?: string, vehicle?: TradingVehicle) =>
  request<Trade[]>(`/api/strategies/${name}/trades?${qs(pair, interval, vehicle, { limit })}`);

export const fetchStats = (name: StrategyName, pair: string, interval?: string, vehicle?: TradingVehicle) =>
  request<Stats>(`/api/strategies/${name}/stats?${qs(pair, interval, vehicle)}`);

export const fetchPnl = (name: StrategyName, pair: string, interval?: string, vehicle?: TradingVehicle) =>
  request<PnlBreakdown>(`/api/strategies/${name}/pnl?${qs(pair, interval, vehicle)}`);

export const fetchAllTripleStats = (vehicle?: TradingVehicle) =>
  request<TripleStats[]>(`/api/stats/all-triples${vehicle ? `?vehicle=${encodeURIComponent(vehicle)}` : ''}`);

export const updateConfig = (cfg: ConfigUpdate) =>
  request<string>('/api/config', { method: 'POST', body: JSON.stringify(cfg) });
