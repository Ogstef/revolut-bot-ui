const BASE = 'http://localhost:8089';

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

export type StrategyName =
  | 'EMA_CROSSOVER'
  | 'MACD'
  | 'BOLLINGER'
  | 'RSI_MOMENTUM'
  | 'STOCH_RSI'
  | 'TRIPLE_EMA'
  | 'PARABOLIC_SAR'
  | 'ADX_DI'
  | 'CCI'
  | 'MFI'
  | 'DONCHIAN'
  | 'ICHIMOKU';

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

export interface StrategyInfo {
  name: StrategyName;
  displayName: string;
  openPositions: number;
  dailyPnl: number;
  consecutiveLosses: number;
  circuitBreakerActive: boolean;
}

export interface Position {
  id: number;
  pair: string;
  interval?: string;
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
  interval?: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL';
  strategyName: StrategyName;
  tradingMode: string;
  executedAt: string;  // entry/open time
  closedAt?: string;   // exit/close time — use this for "Closed At" display
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

export interface PairInfo {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface IntervalInfo {
  minutes: number;
  label: string;        // "15m", "1h", "4h", "1d"
  displayName: string;  // "15 min", "1 hour", "4 hours", "1 day"
}

export interface SignalSummary {
  strategy: StrategyName;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  count: number;
}

export interface Signal {
  id: number;
  pair: string;
  interval?: string;
  strategyName: StrategyName;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  emaShort?: number;
  emaLong?: number;
  rsi?: number;
  currentPrice: number;
  createdAt: string;
}

export interface FearGreed {
  value: number;           // 0–100
  classification: string;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: number;       // unix epoch seconds
}

export interface ConfigUpdate {
  maxPositionPct?: number;
  maxConcurrentPositions?: number;
  maxDailyLossPct?: number;
  maxConsecutiveLosses?: number;
  takeProfitPct?: number;
  stopLossPct?: number;
  emaShortPeriod?: number;
  emaLongPeriod?: number;
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  paperBalance?: number;
}
