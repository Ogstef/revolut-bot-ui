import { request } from './client';
import type { TodaySummary } from './client';

export const fetchToday = () => request<TodaySummary>('/api/today');
