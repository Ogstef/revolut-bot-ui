import { request } from './client';
import type { BotEvent, BotEventType } from './client';

export const fetchActivity = (limit: number = 100, types?: BotEventType[]) => {
  const parts: string[] = [`limit=${limit}`];
  if (types && types.length > 0) parts.push(`types=${types.join(',')}`);
  return request<BotEvent[]>(`/api/activity?${parts.join('&')}`);
};
