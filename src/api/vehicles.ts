import { request } from './client';
import type { VehicleInfo } from './client';

export const fetchVehicles = () => request<VehicleInfo[]>('/api/vehicles');
