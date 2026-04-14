import { useMemo, useState } from 'react';
import type { StrategyName, TradeHistoryEntry } from '../api/client';
import { usePair } from '../context/PairContext';
import { useStrategies } from '../hooks/useStrategies';
import { useHistory } from '../hooks/useHistory';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import KpiStrip                from '../components/history/KpiStrip';
import EquityDrawdownChart     from '../components/history/EquityDrawdownChart';
import MonthlyReturnsHeatmap   from '../components/history/MonthlyReturnsHeatmap';
import ExitReasonDonut         from '../components/history/ExitReasonDonut';
import DurationHistogram       from '../components/history/DurationHistogram';
import RMultipleHistogram      from '../components/history/RMultipleHistogram';
import HourlyPnlHeatmap        from '../components/history/HourlyPnlHeatmap';
import StreakTimeline          from '../components/history/StreakTimeline';
import HistoryFilters, { DEFAULT_FILTERS, type HistoryFilterState } from '../components/history/HistoryFilters';
import TradeHistoryTable       from '../components/history/TradeHistoryTable';

type Preset = '7D' | '30D' | '90D' | 'YTD' | 'ALL';

export default function HistoryPage() {
  const { selectedPair, selectedInterval } = usePair();
  const strategiesQ = useStrategies(selectedPair, selectedInterval);

  const strategyOptions = strategiesQ.data && strategiesQ.data.length > 0
    ? strategiesQ.data.map(s => ({ name: s.name, displayName: s.displayName }))
    : KNOWN_STRATEGIES;

  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>(
    (strategyOptions[0]?.name ?? 'EMA_CROSSOVER') as StrategyName
  );
  const [preset, setPreset] = useState<Preset>('ALL');
  const [filters, setFilters] = useState<HistoryFilterState>(DEFAULT_FILTERS);

  const { from, to } = useMemo(() => presetRange(preset), [preset]);

  const historyQ = useHistory(selectedStrategy, selectedPair, selectedInterval, from, to);
  const trades = useMemo(() => historyQ.data ?? [], [historyQ.data]);

  const filtered = useMemo(() => applyFilters(trades, filters), [trades, filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          History &amp; Analytics
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>
          {selectedPair.replace('-', '/')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
          {selectedInterval}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
          {strategyOptions.find(s => s.name === selectedStrategy)?.displayName ?? selectedStrategy}
        </span>
      </div>

      {/* Strategy chips + date presets */}
      <div className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {strategyOptions.map(s => (
            <Chip
              key={s.name}
              label={s.displayName}
              active={s.name === selectedStrategy}
              onClick={() => setSelectedStrategy(s.name as StrategyName)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="label">Date range</span>
          {(['7D','30D','90D','YTD','ALL'] as Preset[]).map(p => (
            <Chip
              key={p}
              label={p}
              active={p === preset}
              onClick={() => setPreset(p)}
              accent
            />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
            {historyQ.isLoading ? 'Loading…' : historyQ.isError ? 'Failed to load' : `${trades.length} trades total`}
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip trades={filtered} />

      {/* Equity & drawdown */}
      <EquityDrawdownChart trades={filtered} />

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MonthlyReturnsHeatmap trades={filtered} />
        <ExitReasonDonut       trades={filtered} />
        <DurationHistogram     trades={filtered} />
        <RMultipleHistogram    trades={filtered} />
        <HourlyPnlHeatmap      trades={filtered} />
        <StreakTimeline        trades={filtered} />
      </div>

      {/* Filters + table */}
      <HistoryFilters
        value={filters}
        onChange={setFilters}
        total={trades.length}
        shown={filtered.length}
      />
      <TradeHistoryTable trades={filtered} isLoading={historyQ.isLoading} />
    </div>
  );
}

function Chip({ label, active, onClick, accent }: {
  label: string; active: boolean; onClick: () => void; accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 2,
        padding: '4px 10px',
        color: active ? (accent ? 'var(--amber)' : 'var(--green)') : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}

function presetRange(p: Preset): { from?: string; to?: string } {
  if (p === 'ALL') return {};
  const now = new Date();
  const from = new Date(now);
  if (p === '7D')  from.setDate(now.getDate() - 7);
  if (p === '30D') from.setDate(now.getDate() - 30);
  if (p === '90D') from.setDate(now.getDate() - 90);
  if (p === 'YTD') { from.setMonth(0); from.setDate(1); from.setHours(0, 0, 0, 0); }
  return { from: toLocalIso(from) };
}

/** Format a Date as a LocalDateTime string the Spring backend will parse with @DateTimeFormat. */
function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function applyFilters(trades: TradeHistoryEntry[], f: HistoryFilterState): TradeHistoryEntry[] {
  const search = f.search.trim().toLowerCase();
  return trades.filter(t => {
    if (f.side   !== 'ALL' && t.side !== f.side) return false;
    if (f.reason !== 'ALL' && t.exitReason !== f.reason) return false;
    if (f.pnl === 'WINS'   && (t.pnl ?? 0) <= 0) return false;
    if (f.pnl === 'LOSSES' && (t.pnl ?? 0) >= 0) return false;
    if (search && !(t.entrySignalReason ?? '').toLowerCase().includes(search)) return false;
    return true;
  });
}
