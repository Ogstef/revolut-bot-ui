import { request } from './client';
import type { CandleBar } from './client';

export function fetchCandles(pair: string, interval: string, limit = 500): Promise<CandleBar[]> {
  return request<CandleBar[]>(
    `/api/candles?pair=${encodeURIComponent(pair)}&interval=${encodeURIComponent(interval)}&limit=${limit}`
  );
}
