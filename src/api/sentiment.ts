import { request } from './client';
import type { Sentiment, SentimentSource } from './client';

export function fetchSentiment(
  pair: string,
  source: SentimentSource = 'COMBINED',
  interval?: string,
): Promise<Sentiment> {
  const params = new URLSearchParams({ pair, source });
  if (interval) params.set('interval', interval);
  return request<Sentiment>(`/api/market/sentiment?${params.toString()}`);
}
