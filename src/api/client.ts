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
  | 'SUPERTREND'
  | 'REDDIT_SENTIMENT'
  | 'CRYPTOPANIC_SENTIMENT'
  | 'COMBINED_SENTIMENT';

export type SentimentSource = 'REDDIT' | 'CRYPTOPANIC' | 'COMBINED';

export interface SentimentSubScore {
  source: SentimentSource;
  score: number | null;
  volume: number;
  sampleSize: number;
}

export interface Sentiment {
  pair: string;
  source: SentimentSource;
  interval: string;
  score: number | null;          // [-1, +1], null when insufficient sample
  volume: number;
  sampleSize: number;
  capturedAt: string;
  stale: boolean;                // true when sample fell below threshold
  subScores: SentimentSubScore[] | null;   // populated only when source === "COMBINED"
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
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL';
  strategyName: StrategyName;
  tradingMode: string;
  executedAt: string;  // entry/open time
  closedAt?: string;   // exit/close time — use this for "Closed At" display
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
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL' | null;
  tradingMode: 'PAPER' | 'LIVE';
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
  enabled: boolean;
}

export interface DisabledTriple {
  pair: string;
  strategy: StrategyName;
  interval: string;
  disabledAt: string;
  reason: string | null;
}

// ─── Backtester ─────────────────────────────────────────────────────────────

export interface BacktestRequest {
  pair: string;
  strategy: StrategyName;
  interval: string;
  startDate: string;       // ISO 8601, no TZ
  endDate: string;
  startingBalance?: number;
  paramOverrides?: Record<string, number>;
  label?: string;
  notes?: string;
}

export interface BacktestStats {
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
  netPnl: number;
  totalFees: number;
  totalSlippage: number;
  feeDragPct: number;
  netExpectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  maxDrawdownDurationBars: number;
  profitFactor: number;
  maxConsecutiveLosses: number;
  tradesPerMonth: number;
  tStatistic: number;
  pnlStdDev: number;
}

export interface SimulatedTrade {
  sequence: number;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  executedAt: string;
  closedAt: string;
  pnl: number;
  pnlPct: number;
  entryFee: number;
  exitFee: number;
  entrySlippage: number;
  exitSlippage: number;
  netPnl: number;
  netPnlPct: number;
  exitReason: 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'BACKTEST_END';
  entrySignalReason: string;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
  drawdownPct: number;
}

export interface BacktestRunSummary {
  id: string;
  pair: string;
  strategy: StrategyName;
  interval: string;
  startDate: string;
  endDate: string;
  startingBalance: number;
  stats: BacktestStats;
  label: string | null;
  createdAt: string;
}

export interface BacktestRunDetail extends BacktestRunSummary {
  params: Record<string, unknown>;
  trades: SimulatedTrade[];
  equityCurve: EquityPoint[];
  notes: string | null;
}

export type ConsistencyVerdict =
  | 'STABLE'
  | 'REGIME_DEPENDENT'
  | 'WILDLY_VARYING_HIGH_VARIANCE'
  | 'WILDLY_VARYING_NEGATIVE';

export interface SkippedWindow {
  index: number;          // 1-based
  startDate: string;      // ISO 8601
  endDate: string;
  reason: string;
}

export interface WalkForwardResult {
  windows: BacktestRunSummary[];
  skippedWindows: SkippedWindow[];
  varianceMetrics: {
    winRateStdDev: number;
    expectancyStdDev: number;
    netPnlStdDev: number;
    consistencyVerdict: ConsistencyVerdict;
  };
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
