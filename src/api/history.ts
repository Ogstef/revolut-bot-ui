import { request } from './client';
import type { StrategyName, TradeHistoryEntry, TradingVehicle } from './client';

export const fetchHistory = (
  name: StrategyName,
  pair: string,
  interval?: string,
  from?: string,
  to?: string,
  vehicle?: TradingVehicle,
) => {
  const parts: string[] = [`pair=${encodeURIComponent(pair)}`];
  if (interval) parts.push(`interval=${encodeURIComponent(interval)}`);
  if (from)     parts.push(`from=${encodeURIComponent(from)}`);
  if (to)       parts.push(`to=${encodeURIComponent(to)}`);
  if (vehicle)  parts.push(`vehicle=${encodeURIComponent(vehicle)}`);
  return request<TradeHistoryEntry[]>(`/api/strategies/${name}/history?${parts.join('&')}`);
};
