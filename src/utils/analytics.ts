import type { Trade, TradeHistoryEntry } from '../api/client';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert a list of trades into a cumulative PnL series for Recharts.
 * When `cutoff` is provided, trades closed before it are filtered out.
 */
export function toCumulativePnl(
  trades: Trade[],
  cutoff?: Date,
): { date: number; pnl: number }[] {
  const filtered = cutoff
    ? trades.filter(t => new Date(t.closedAt ?? t.executedAt) >= cutoff)
    : trades;
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.closedAt ?? a.executedAt).getTime() - new Date(b.closedAt ?? b.executedAt).getTime(),
  );
  let running = 0;
  return sorted.map(t => ({
    date: new Date(t.closedAt ?? t.executedAt).getTime(),
    pnl: parseFloat((running += t.pnl ?? 0).toFixed(2)),
  }));
}

/** Trades in chronological order (oldest -> newest), filtered to ones with a numeric pnl. */
export function chronological(trades: TradeHistoryEntry[]): TradeHistoryEntry[] {
  return [...trades]
    .filter(t => t.pnl != null)
    .sort((a, b) => +new Date(a.executedAt) - +new Date(b.executedAt));
}

/** A trade is "closed" when it has both an exit price and a numeric PnL. */
export function isClosed(t: TradeHistoryEntry): boolean {
  return t.exitPrice != null && t.pnl != null && t.closedAt != null;
}

// ─── Equity & drawdown ─────────────────────────────────────────────────────

export interface EquityPoint { date: string; equity: number; }

export function equityCurve(trades: TradeHistoryEntry[]): EquityPoint[] {
  let running = 0;
  return chronological(trades).map(t => {
    running += (t.netPnl ?? t.pnl) ?? 0;
    return { date: t.closedAt ?? t.executedAt, equity: running };
  });
}

export interface DrawdownPoint { date: string; drawdown: number; }

/** Drawdown = current equity − running peak (≤ 0). */
export function drawdownSeries(equity: EquityPoint[]): DrawdownPoint[] {
  let peak = 0;
  return equity.map(p => {
    if (p.equity > peak) peak = p.equity;
    return { date: p.date, drawdown: p.equity - peak };
  });
}

/** Worst drawdown across the whole history (always ≤ 0; 0 when no losses). */
export function maxDrawdown(equity: EquityPoint[]): number {
  if (equity.length === 0) return 0;
  let min = 0;
  for (const p of drawdownSeries(equity)) {
    if (p.drawdown < min) min = p.drawdown;
  }
  return min;
}

// ─── Aggregates ────────────────────────────────────────────────────────────

/** Σ winning PnL / |Σ losing PnL|. Infinity if no losses. Uses net PnL when available. */
export function profitFactor(trades: TradeHistoryEntry[]): number {
  let wins = 0;
  let losses = 0;
  for (const t of trades) {
    const val = (t.netPnl ?? t.pnl);
    if (val == null) continue;
    if (val >= 0) wins += val;
    else losses += val;
  }
  if (losses === 0) return wins > 0 ? Infinity : 0;
  return wins / Math.abs(losses);
}

export function expectancy(trades: TradeHistoryEntry[]): number {
  const closed = trades.filter(t => t.pnl != null);
  if (closed.length === 0) return 0;
  const sum = closed.reduce((acc, t) => acc + ((t.netPnl ?? t.pnl) ?? 0), 0);
  return sum / closed.length;
}

export function avgHoldingSeconds(trades: TradeHistoryEntry[]): number {
  const withDur = trades.filter(t => t.holdingDurationSeconds != null);
  if (withDur.length === 0) return 0;
  const sum = withDur.reduce((acc, t) => acc + (t.holdingDurationSeconds ?? 0), 0);
  return sum / withDur.length;
}

// ─── Streaks ───────────────────────────────────────────────────────────────

export interface Streak {
  type: 'W' | 'L';
  length: number;
  startedAt: string;
  endedAt: string;
}

export function streaks(trades: TradeHistoryEntry[]): Streak[] {
  const sorted = chronological(trades);
  const out: Streak[] = [];
  let cur: Streak | null = null;
  for (const t of sorted) {
    const type: 'W' | 'L' = ((t.netPnl ?? t.pnl) ?? 0) >= 0 ? 'W' : 'L';
    const ts = t.closedAt ?? t.executedAt;
    if (cur && cur.type === type) {
      cur.length += 1;
      cur.endedAt = ts;
    } else {
      if (cur) out.push(cur);
      cur = { type, length: 1, startedAt: ts, endedAt: ts };
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function longestStreak(trades: TradeHistoryEntry[], type: 'W' | 'L'): number {
  let max = 0;
  for (const s of streaks(trades)) {
    if (s.type === type && s.length > max) max = s.length;
  }
  return max;
}

// ─── Monthly returns ───────────────────────────────────────────────────────

/** Map "YYYY-MM" -> net sum of PnL for trades closed (or executed if not closed) in that month. */
export function monthlyReturns(trades: TradeHistoryEntry[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of trades) {
    if (t.pnl == null) continue;
    const ref = t.closedAt ?? t.executedAt;
    const d = new Date(ref);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.set(key, (out.get(key) ?? 0) + ((t.netPnl ?? t.pnl) ?? 0));
  }
  return out;
}

// ─── Duration histogram ────────────────────────────────────────────────────

/** Buckets in seconds, ordered low → high. The final bucket catches anything > the last bound. */
const DURATION_BUCKETS: { label: string; max: number }[] = [
  { label: '<1m',     max: 60 },
  { label: '1-5m',    max: 5 * 60 },
  { label: '5-15m',   max: 15 * 60 },
  { label: '15m-1h',  max: 60 * 60 },
  { label: '1-4h',    max: 4 * 60 * 60 },
  { label: '4-12h',   max: 12 * 60 * 60 },
  { label: '12-24h',  max: 24 * 60 * 60 },
  { label: '1-3d',    max: 3 * 24 * 60 * 60 },
  { label: '3-7d',    max: 7 * 24 * 60 * 60 },
  { label: '>7d',     max: Number.POSITIVE_INFINITY },
];

export interface DurationBucket { label: string; count: number; }

export function durationBuckets(trades: TradeHistoryEntry[]): DurationBucket[] {
  const counts = DURATION_BUCKETS.map(b => ({ label: b.label, count: 0 }));
  for (const t of trades) {
    const sec = t.holdingDurationSeconds;
    if (sec == null) continue;
    for (let i = 0; i < DURATION_BUCKETS.length; i += 1) {
      if (sec <= DURATION_BUCKETS[i].max) { counts[i].count += 1; break; }
    }
  }
  return counts;
}

// ─── R-multiple distribution ───────────────────────────────────────────────

const R_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '< -3R',   min: -Infinity, max: -3 },
  { label: '-3 / -2', min: -3, max: -2 },
  { label: '-2 / -1', min: -2, max: -1 },
  { label: '-1 / 0',  min: -1, max: 0 },
  { label: '0 / 1',   min: 0,  max: 1 },
  { label: '1 / 2',   min: 1,  max: 2 },
  { label: '2 / 3',   min: 2,  max: 3 },
  { label: '3 / 5',   min: 3,  max: 5 },
  { label: '> 5R',    min: 5,  max: Infinity },
];

export interface RBucket { label: string; count: number; sign: 'pos' | 'neg' | 'zero'; }

export function rMultipleDistribution(trades: TradeHistoryEntry[]): RBucket[] {
  const out: RBucket[] = R_BUCKETS.map(b => ({
    label: b.label,
    count: 0,
    sign: b.min >= 0 ? 'pos' : b.max <= 0 ? 'neg' : 'zero',
  }));
  for (const t of trades) {
    const r = t.rMultiple;
    if (r == null) continue;
    for (let i = 0; i < R_BUCKETS.length; i += 1) {
      const { min, max } = R_BUCKETS[i];
      if (r >= min && r < max) { out[i].count += 1; break; }
      if (i === R_BUCKETS.length - 1 && r >= min) { out[i].count += 1; }
    }
  }
  return out;
}

// ─── Day-of-week × hour-of-day PnL grid ────────────────────────────────────

export interface HourCell { dow: number; hour: number; pnl: number; count: number; }

export function hourlyDayPnl(trades: TradeHistoryEntry[]): HourCell[] {
  const grid: HourCell[] = [];
  for (let d = 0; d < 7; d += 1) {
    for (let h = 0; h < 24; h += 1) {
      grid.push({ dow: d, hour: h, pnl: 0, count: 0 });
    }
  }
  for (const t of trades) {
    if (t.pnl == null) continue;
    const ref = t.executedAt;
    const date = new Date(ref);
    const dow = date.getDay();    // 0 = Sunday
    const hour = date.getHours();
    const cell = grid[dow * 24 + hour];
    cell.pnl += t.pnl;
    cell.count += 1;
  }
  return grid;
}

// ─── Exit reason breakdown ─────────────────────────────────────────────────

export interface ExitReasonSlice { reason: string; count: number; pnl: number; }

export function exitReasonBreakdown(trades: TradeHistoryEntry[]): ExitReasonSlice[] {
  const map = new Map<string, ExitReasonSlice>();
  for (const t of trades) {
    if (t.pnl == null) continue;
    const reason = t.exitReason ?? 'UNKNOWN';
    const slot = map.get(reason) ?? { reason, count: 0, pnl: 0 };
    slot.count += 1;
    slot.pnl += t.pnl;
    map.set(reason, slot);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ─── Win rate ──────────────────────────────────────────────────────────────

export function winRate(trades: TradeHistoryEntry[]): number {
  const closed = trades.filter(t => t.pnl != null);
  if (closed.length === 0) return 0;
  const wins = closed.filter(t => ((t.netPnl ?? t.pnl) ?? 0) > 0).length;
  return (wins / closed.length) * 100;
}

// ─── Duration formatter ────────────────────────────────────────────────────

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? `${d}d` : `${d}d ${rh}h`;
}
