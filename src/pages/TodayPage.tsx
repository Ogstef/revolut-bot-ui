import { useMemo, useState } from 'react';
import type { Trade, TodayTripleRow, Position } from '../api/client';
import { useToday } from '../hooks/useToday';
import {
  formatPnl, formatPct, formatPrice, formatQty,
  formatTime, formatTimeAgo, formatFee, formatFeeDrag, feeDragTier,
} from '../utils/format';

interface Props {
  onSelectStrategy?: (name: string) => void;
}

type TripleSortKey =
  | 'pair' | 'interval' | 'displayName'
  | 'totalTrades' | 'winningTrades' | 'losingTrades'
  | 'grossPnl' | 'netPnl' | 'totalCosts';

const TRIPLE_NUMERIC_KEYS: TripleSortKey[] = [
  'totalTrades', 'winningTrades', 'losingTrades', 'grossPnl', 'netPnl', 'totalCosts',
];

export default function TodayPage({ onSelectStrategy }: Props) {
  const todayQ = useToday();
  const [tripleSort, setTripleSort] = useState<TripleSortKey>('netPnl');
  const [tripleDir, setTripleDir] = useState<'asc' | 'desc'>('desc');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');

  const data = todayQ.data;

  const triples = useMemo(() => {
    if (!data) return [];
    const mult = tripleDir === 'desc' ? -1 : 1;
    return [...data.byTriple].sort((a, b) => {
      if (TRIPLE_NUMERIC_KEYS.includes(tripleSort)) {
        return ((a[tripleSort] as number) - (b[tripleSort] as number)) * mult;
      }
      return String(a[tripleSort]).localeCompare(String(b[tripleSort])) * mult;
    });
  }, [data, tripleSort, tripleDir]);

  const filteredTrades = useMemo(() => {
    if (!data) return [];
    return data.trades.filter(t => {
      if (tradeFilter === 'WINS')   return (t.pnl ?? 0) > 0;
      if (tradeFilter === 'LOSSES') return (t.pnl ?? 0) <= 0;
      return true;
    });
  }, [data, tradeFilter]);

  const dateStr = useMemo(() => {
    if (!data?.date) return '';
    const d = new Date(data.date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [data?.date]);

  if (todayQ.isLoading) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading today…</div>;
  }
  if (todayQ.isError || !data) {
    return (
      <div style={{ padding: 20, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
        Failed to load today's activity. Is the backend running?
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Today
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {dateStr}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          updated {formatTimeAgo(data.generatedAt)}
        </span>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 8,
      }}>
        <Kpi label="Trades" value={String(data.totalTrades)} />
        <Kpi label="Wins"   value={String(data.winningTrades)} valueColor="var(--green)" />
        <Kpi label="Losses" value={String(data.losingTrades)}  valueColor="var(--red)" />
        <Kpi label="Win Rate" value={`${data.winRate.toFixed(1)}%`} />
        <Kpi label="Net PnL"   value={formatPnl(data.netPnl)}   valueColor={pnlColor(data.netPnl)} highlight />
        <Kpi label="Gross PnL" value={formatPnl(data.grossPnl)} valueColor={pnlColor(data.grossPnl)} />
        <Kpi label="Fees"      value={formatFee(data.totalFees)} />
        <Kpi label="Slippage"  value={formatFee(data.totalSlippage)} />
        <Kpi label="Best"      value={formatPnl(data.bestTrade)}  valueColor="var(--green)" />
        <Kpi label="Worst"     value={formatPnl(data.worstTrade)} valueColor="var(--red)" />
        <Kpi label="Expectancy" value={formatPnl(data.expectancy) + ' / trade'} />
        <Kpi label="Fee Drag"   value={formatFeeDrag(data.feeDragPct)}
             valueColor={feeDragColor(data.feeDragPct)} />
      </div>

      {/* ── Position counters ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        <Kpi label="Opened today"     value={String(data.positionsOpenedToday)} />
        <Kpi label="Closed today"     value={String(data.positionsClosedToday)} />
        <Kpi label="Open right now"   value={String(data.openPositionsNow)} />
      </div>

      {/* ── Per-triple breakdown ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHead title={`Per-strategy breakdown (${triples.length} traded today)`} />
        {triples.length === 0 ? (
          <Empty>No strategies have traded today yet.</Empty>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <Th label="Pair"       k="pair"          sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} />
                <Th label="Interval"   k="interval"      sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} />
                <Th label="Strategy"   k="displayName"   sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} />
                <Th label="Trades"     k="totalTrades"   sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
                <Th label="W"          k="winningTrades" sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
                <Th label="L"          k="losingTrades"  sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
                <Th label="Net PnL"    k="netPnl"        sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
                <Th label="Gross PnL"  k="grossPnl"      sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
                <Th label="Costs"      k="totalCosts"    sort={tripleSort} dir={tripleDir} onSort={(k, d) => { setTripleSort(k); setTripleDir(d); }} numeric />
              </tr>
            </thead>
            <tbody>
              {triples.map((r: TodayTripleRow) => (
                <tr
                  key={`${r.pair}|${r.interval}|${r.strategy}`}
                  onClick={() => onSelectStrategy?.(r.strategy)}
                  style={{ cursor: onSelectStrategy ? 'pointer' : 'default' }}
                >
                  <td>{r.pair}</td>
                  <td><span style={{ color: 'var(--amber)' }}>{r.interval}</span></td>
                  <td>{r.displayName}</td>
                  <td style={{ textAlign: 'right' }}>{r.totalTrades}</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)' }}>{r.winningTrades}</td>
                  <td style={{ textAlign: 'right', color: 'var(--red)' }}>{r.losingTrades}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(r.netPnl), fontWeight: 600 }}>{formatPnl(r.netPnl)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(r.grossPnl) }}>{formatPnl(r.grossPnl)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatFee(r.totalCosts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Trades today ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Closed trades today ({filteredTrades.length}{tradeFilter !== 'ALL' ? ` of ${data.trades.length}` : ''})
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['ALL', 'WINS', 'LOSSES'] as const).map(f => (
              <FilterChip key={f} label={f} active={tradeFilter === f} onClick={() => setTradeFilter(f)} />
            ))}
          </div>
        </div>
        {filteredTrades.length === 0 ? (
          <Empty>No closed trades to show.</Empty>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Closed</th>
                <th style={{ textAlign: 'left' }}>Pair</th>
                <th style={{ textAlign: 'left' }}>Interval</th>
                <th style={{ textAlign: 'left' }}>Strategy</th>
                <th style={{ textAlign: 'left' }}>Side</th>
                <th style={{ textAlign: 'right' }}>Entry</th>
                <th style={{ textAlign: 'right' }}>Exit</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Net PnL</th>
                <th style={{ textAlign: 'right' }}>Gross</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th style={{ textAlign: 'left' }}>Exit reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((t: Trade) => (
                <tr key={t.id}>
                  <td>{t.closedAt ? formatTime(t.closedAt) : '—'}</td>
                  <td>{t.pair}</td>
                  <td><span style={{ color: 'var(--amber)' }}>{t.interval ?? '15m'}</span></td>
                  <td style={{ fontSize: 11 }}>{t.strategyName}</td>
                  <td>
                    <span style={{ color: t.side === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {t.side}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(t.entryPrice)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(t.exitPrice)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatQty(t.quantity)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(t.netPnl), fontWeight: 600 }}>{formatPnl(t.netPnl)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(t.pnl) }}>{formatPnl(t.pnl)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(t.pnlPct) }}>{formatPct(t.pnlPct)}</td>
                  <td><ExitReasonBadge reason={t.exitReason} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Positions still open from today ──────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHead title={`Open positions from today (${data.openPositions.length})`} />
        {data.openPositions.length === 0 ? (
          <Empty>No positions opened today are still open.</Empty>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Opened</th>
                <th style={{ textAlign: 'left' }}>Pair</th>
                <th style={{ textAlign: 'left' }}>Interval</th>
                <th style={{ textAlign: 'left' }}>Strategy</th>
                <th style={{ textAlign: 'left' }}>Side</th>
                <th style={{ textAlign: 'right' }}>Entry</th>
                <th style={{ textAlign: 'right' }}>Now</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unreal. PnL</th>
                <th style={{ textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {data.openPositions.map((p: Position) => (
                <tr key={p.id}>
                  <td>{formatTime(p.openedAt)}</td>
                  <td>{p.pair}</td>
                  <td><span style={{ color: 'var(--amber)' }}>{p.interval ?? '—'}</span></td>
                  <td style={{ fontSize: 11 }}>{p.displayName ?? p.strategyName}</td>
                  <td>
                    <span style={{ color: p.side === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {p.side}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(p.entryPrice)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(p.currentPrice)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatQty(p.quantity)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(p.unrealisedPnl), fontWeight: 600 }}>{formatPnl(p.unrealisedPnl)}</td>
                  <td style={{ textAlign: 'right', color: pnlColor(p.unrealisedPnlPct) }}>{formatPct(p.unrealisedPnlPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────

function pnlColor(v: number | null | undefined): string {
  if (v == null || v === 0) return 'var(--text-primary)';
  return v > 0 ? 'var(--green)' : 'var(--red)';
}

function feeDragColor(pct: number): string {
  const tier = feeDragTier(pct);
  if (tier === 'victim' || tier === 'high') return 'var(--red)';
  if (tier === 'mid') return 'var(--amber)';
  return 'var(--green)';
}

function Kpi({
  label, value, valueColor, highlight,
}: { label: string; value: string; valueColor?: string; highlight?: boolean }) {
  return (
    <div className="card" style={{
      padding: '10px 12px',
      borderColor: highlight ? 'var(--border-bright)' : undefined,
      background: highlight ? 'rgba(0,230,118,0.04)' : undefined,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginTop: 4,
        color: valueColor ?? 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderBottom: '1px solid var(--border)',
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
    }}>
      {title}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
      {children}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 2,
        padding: '3px 8px',
        color: active ? 'var(--green)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ExitReasonBadge({ reason }: { reason: string | null }) {
  if (!reason) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const map: Record<string, { color: string; label: string }> = {
    TP_HIT:      { color: 'var(--green)', label: 'TP' },
    SL_HIT:      { color: 'var(--red)',   label: 'SL' },
    SIGNAL_EXIT: { color: 'var(--amber)', label: 'SIGNAL' },
    MANUAL:      { color: 'var(--text-muted)', label: 'MANUAL' },
  };
  const m = map[reason] ?? { color: 'var(--text-muted)', label: reason };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: m.color, letterSpacing: '0.04em',
    }}>
      {m.label}
    </span>
  );
}

function Th<K extends string>({
  label, k, sort, dir, onSort, numeric,
}: {
  label: string;
  k: K;
  sort: K;
  dir: 'asc' | 'desc';
  onSort: (k: K, d: 'asc' | 'desc') => void;
  numeric?: boolean;
}) {
  const active = sort === k;
  return (
    <th
      style={{ textAlign: numeric ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(k, active && dir === 'desc' ? 'asc' : 'desc')}
    >
      {label}{active ? (dir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  );
}
