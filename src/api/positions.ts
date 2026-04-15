import { request } from './client';
import type { Position } from './client';

export const fetchLivePositions = () =>
  request<Position[]>(`/api/positions/live`);
