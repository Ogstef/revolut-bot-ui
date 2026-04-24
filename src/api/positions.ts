import { request } from './client';
import type { Position, TradingVehicle } from './client';

export const fetchLivePositions = (vehicle?: TradingVehicle) => {
  const qs = vehicle ? `?vehicle=${encodeURIComponent(vehicle)}` : '';
  return request<Position[]>(`/api/positions/live${qs}`);
};
