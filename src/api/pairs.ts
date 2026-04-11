import { request } from './client';
import type { PairInfo } from './client';

export const fetchPairs = () => request<PairInfo[]>('/api/pairs');
