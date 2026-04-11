import { request } from './client';
import type { BotStatus } from './client';

export const fetchStatus = () => request<BotStatus>('/api/status');
export const emergencyStop = () => request<string>('/api/emergency-stop', { method: 'POST' });
export const resume = () => request<string>('/api/resume', { method: 'POST' });
