const BASE = 'http://localhost:8089';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

export const api = {
  getStatus: () => request<BotStatus>('/api/status'),
  getPositions: () => request<Position[]>('/api/positions'),
  getTrades: (limit = 50) => request<Trade[]>(`/api/trades?limit=${limit}`),
  getStats: () => request<Stats>('/api/stats'),
  getPnl: () => request<PnlBreakdown>('/api/pnl'),
  emergencyStop: () => request<string>('/api/emergency-stop', { method: 'POST' }),
  resume: () => request<string>('/api/resume', { method: 'POST' }),
  updateConfig: (cfg: Partial<ConfigUpdate>) =>
    request<string>('/api/config', { method: 'POST', body: JSON.stringify(cfg) }),
};

export interface BotStatus {
  running: boolean;
  mode: 'PAPER' | 'LIVE';
  pair: string;
  openPositions: number;
  dailyPnl: number;
  consecutiveLosses: number;
  circuitBreakerOn: boolean;
  reportedAt: string;
}

export interface Position {
  id: number;
  pair: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  takeProfit: number;
  stopLoss: number;
  currentPrice: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  signalReason: string;
  openedAt: string;
}

export interface Trade {
  id: number;
  pair: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL';
  tradingMode: string;
  executedAt: string;
}

export interface Stats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number;
}

export interface PnlBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
}

export interface ConfigUpdate {
  maxPositionPct: number;
  maxConcurrentPositions: number;
  maxDailyLossPct: number;
  maxConsecutiveLosses: number;
  takeProfitPct: number;
  stopLossPct: number;
  emaShortPeriod: number;
  emaLongPeriod: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  paperBalance: number;
}
