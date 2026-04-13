import { request } from './client';
import type { FearGreed } from './client';

export const fetchFearGreed = () => request<FearGreed>('/api/market/fear-greed');
