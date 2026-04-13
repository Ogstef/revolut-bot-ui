import { request } from './client';
import type { IntervalInfo } from './client';

export const fetchIntervals = () => request<IntervalInfo[]>('/api/intervals');
