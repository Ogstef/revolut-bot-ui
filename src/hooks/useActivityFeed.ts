import { useQuery } from '@tanstack/react-query';
import { fetchActivity } from '../api/activity';
import type { BotEventType } from '../api/client';

export function useActivityFeed(limit?: number, types?: BotEventType[]) {
  return useQuery({
    queryKey: ['activity', limit, types?.sort().join(',')],
    queryFn: () => fetchActivity(limit, types),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
