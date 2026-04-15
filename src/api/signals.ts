import { request } from './client';
import type { StrategyName, SignalSummary, Signal, CurrentSignal } from './client';

function qs(pair: string, interval?: string, extra?: Record<string, string | number>): string {
  const parts: string[] = [`pair=${encodeURIComponent(pair)}`];
  if (interval) parts.push(`interval=${encodeURIComponent(interval)}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${encodeURIComponent(String(v))}`);
  }
  return parts.join('&');
}

/** Builds an optional query string — returns '' when both pair and interval are absent. */
function optionalQs(pair?: string, interval?: string): string {
  const parts: string[] = [];
  if (pair) parts.push(`pair=${encodeURIComponent(pair)}`);
  if (interval) parts.push(`interval=${encodeURIComponent(interval)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const fetchSignalSummary = (pair: string, interval?: string) =>
  request<SignalSummary[]>(`/api/signals/summary?${qs(pair, interval)}`);

export const fetchStrategySignals = (name: StrategyName, pair: string, limit = 20, interval?: string) =>
  request<Signal[]>(`/api/strategies/${name}/signals?${qs(pair, interval, { limit })}`);

export const fetchCurrentSignals = (pair?: string, interval?: string) =>
  request<CurrentSignal[]>(`/api/signals/current${optionalQs(pair, interval)}`);
