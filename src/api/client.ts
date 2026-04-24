const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

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
  | 'ICHIMOKU'
  | 'SUPERTREND';

export type TradingVehicle = 'SPOT' | 'LEV_3X' | 'LEV_5X' | 'LEV_10X';

export interface VehicleInfo {
  name: TradingVehicle;
  leverage: number;
  active: boolean;
}

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
  strategyName?: StrategyName;
  displayName?: string;
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
  // Phase 13 leverage fields — nullable for SPOT
  vehicle?: TradingVehicle;
  leverage?: number;
  collateral?: number | null;
  notional?: number | null;
  liquidationPrice?: number | null;
  currentMarginRatio?: number | null;
  fundingFeesAccrued?: number | null;
}

export interface Trade {
  id: number;
  pair: string;
  interval?: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;           // gross
  pnlPct: number;        // gross %
  netPnl: number | null;
  netPnlPct: number | null;
  entryFee: number;
  exitFee: number;
  entrySlippage: number;
  exitSlippage: number;
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL' | 'LIQUIDATED';
  strategyName: StrategyName;
  tradingMode: string;
  executedAt: string;  // entry/open time
  closedAt?: string;   // exit/close time — use this for "Closed At" display
  // Phase 13 leverage fields — defaults on SPOT: vehicle=SPOT, leverage=1, collateral=null, fundingFees=0, liquidated=false
  vehicle?: TradingVehicle;
  leverage?: number;
  collateral?: number | null;
  fundingFees?: number;
  liquidated?: boolean;
}

/**
 * Closed trade enriched with parent-position context — returned by
 * GET /api/strategies/{name}/history. See API_CONTRACT.md §5 for field definitions.
 */
export interface TradeHistoryEntry {
  id: number;
  pair: string;
  interval: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;           // gross
  pnlPct: number | null;        // gross %
  strategyName: StrategyName;
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL' | 'LIQUIDATED' | null;
  tradingMode: 'PAPER' | 'LIVE';
  // Phase 13 leverage fields
  vehicle?: TradingVehicle;
  leverage?: number;
  collateral?: number | null;
  fundingFees?: number;
  liquidated?: boolean;
  executedAt: string;
  closedAt: string | null;
  // Enrichment from the parent Position
  entrySignalReason: string | null;
  takeProfit: number | null;
  stopLoss: number | null;
  openedAt: string | null;
  // Derived analytics
  holdingDurationSeconds: number | null;
  rMultiple: number | null;
  // Cost fields
  entryFee: number;
  exitFee: number;
  entrySlippage: number;
  exitSlippage: number;
  netPnl: number | null;
  netPnlPct: number | null;
}

export interface Stats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;      // gross
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number;
  netPnl: number;
  totalFees: number;
  totalSlippage: number;
  feeDragPct: number;
  netExpectancy: number;
}

export interface PnlBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
  dailyNet: number;
  weeklyNet: number;
  monthlyNet: number;
  allTimeNet: number;
}

export interface PairInfo {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface IntervalInfo {
  minutes: number;
  label: string;        // "15m", "1h", "4h", "1d", "1w"
  displayName: string;  // "15 min", "1 hour", "4 hours", "1 day", "1 week"
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

export interface CurrentSignal {
  pair: string;
  interval: string;
  strategy: StrategyName;
  displayName: string;
  signalType: 'BUY' | 'SELL' | 'HOLD' | null;
  confidence: number | null;
  reason: string | null;
  currentPrice: number | null;
  emaShort: number | null;
  emaLong: number | null;
  rsi: number | null;
  evaluatedAt: string | null;
}

export interface FearGreed {
  value: number;           // 0–100
  classification: string;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: number;       // unix epoch seconds
}

export type BotEventType =
  | 'POSITION_OPENED'
  | 'POSITION_CLOSED'
  | 'POSITION_LIQUIDATED'
  | 'CIRCUIT_BREAKER_TRIPPED'
  | 'CIRCUIT_BREAKER_RESET'
  | 'BOT_STOPPED'
  | 'BOT_RESUMED'
  | 'CONFIG_CHANGED';

export type BotEventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface TripleStats {
  pair: string;
  interval: string;
  strategy: StrategyName;
  displayName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;     // gross
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number;
  openPositions: number;
  circuitBreakerActive: boolean;
  netPnl: number;
  totalCosts: number;
  feeDragPct: number;
  netExpectancy: number;
}

export interface BotEvent {
  id: number;
  type: BotEventType;
  severity: BotEventSeverity;
  pair: string | null;
  interval: string | null;
  strategy: StrategyName | null;
  title: string;
  detail: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface CandleBar {
  time: number;    // Unix epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
