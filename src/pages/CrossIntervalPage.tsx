import { useMemo, useState } from 'react';
import { usePair } from '../context/PairContext';
import { useIntervals } from '../hooks/useIntervals';
import { useAllTripleStats } from '../hooks/useAllTripleStats';
import { useAllIntervalTrades } from '../hooks/useAllIntervalTrades';
import { KNOWN_STRATEGIES, intervalColor } from '../utils/strategyMeta';
import { formatPnl } from '../utils/format';
import CumulativePnlChart from '../components/overview/CumulativePnlChart';
import type { StrategyName, TripleStats, IntervalInfo } from '../api/client';

export default function CrossIntervalPage() {
  const { selectedPair } = usePair();
  const intervalsQ = useIntervals();
  const statsQ = useAllTripleStats();

  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>(
    KNOWN_STRATEGIES[0].name as StrategyName
  );

  const sortedIntervals: IntervalInfo[] = useMemo(() => {
    const arr = Array.isArray(intervalsQ.data) ? intervalsQ.data : [];
    return [...arr].sort((a, b) => a.minutes - b.minutes);
  }, [intervalsQ.data]);

  const intervalLabels = useMemo(
    () => sortedIntervals.map(i => i.label),
    [sortedIntervals]
  );

  const intervalQueries = useAllIntervalTrades(selectedPair, selectedStrategy, intervalLabels);

  const filteredStats: TripleStats[] = useMemo(() => {
    const data = Array.isArray(statsQ.data) ? statsQ.data : [];
    return data.filter(r => r.pair === selectedPair && r.strategy === selectedStrategy);
  }, [statsQ.data, selectedPair, selectedStrategy]);

  const statsByInterval: Map<string, TripleStats> = useMemo(() => {
    const m = new Map<string, TripleStats>();
    for (const r of filteredStats) m.set(r.interval, r);
    return m;
  }, [filteredStats]);

  const bestInterval: string | null = useMemo(() => {
    let best: TripleStats | null = null;
    for (const r of filteredStats) {
      if (r.totalTrades <= 0) continue;
      if (best == null || r.totalPnl > best.totalPnl) best = r;
    }
    return best ? best.interval : null;
  }, [filteredStats]);

  const strategyLabel =
    KNOWN_STRATEGIES.find(s => s.name === selectedStrategy)?.displayName ?? selectedStrategy;

  if (statsQ.isLoading || intervalsQ.isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        Loading cross-interval comparison…
      </div>
    );
  }

  if (statsQ.isError) {
    return (
      <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
        Failed to load stats — is the backend reachable?
      </div>
    );
  }

  if (sortedIntervals.length === 0) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        No intervals configured.
      </div>
    );
  }

  const seriesTrades = intervalQueries.map(({ interval, query }) => ({
    name: interval,
    displayName: interval,
    trades: query.data,
  }));

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Cross-Interval Comparison</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Compare all configured intervals side-by-side for a chosen strategy on the globally selected pair.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {selectedPair} · {strategyLabel} · refreshes every 30s
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="label" style={{ minWidth: 62 }}>Strategy</span>
        {KNOWN_STRATEGIES.map(s => {
          const on = s.name === selectedStrategy;
          return (
            <button
              key={s.name}
              onClick={() => setSelectedStrategy(s.name as StrategyName)}
              className={`badge ${on ? 'badge-green' : 'badge-neutral'}`}
              style={{
                cursor: 'pointer',
                border: on ? '1px solid var(--green)' : '1px solid transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
            >
              {s.displayName}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${sortedIntervals.length}, minmax(0, 1fr))`,
            gap: 1,
            background: 'var(--border)',
          }}
        >
          {sortedIntervals.map(info => {
            const stats = statsByInterval.get(info.label);
            const hasData = !!stats && stats.totalTrades > 0;
            const color = intervalColor(info.label);
            const isBest = bestInterval === info.label;

            return (
              <div
                key={info.label}
                style={{
                  background: 'var(--bg-card)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderTop: isBest ? '2px solid var(--green)' : '2px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 8px',
                      border: `1px solid ${color}`,
                      background: `${color}18`,
                      color,
                      borderRadius: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {info.label}
                  </span>
                  {!hasData && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      no trades yet
                    </span>
                  )}
                </div>

                <StatRow
                  label="Total trades"
                  value={stats ? stats.totalTrades.toLocaleString('en-US') : '—'}
                />
                <StatRow
                  label="Win rate"
                  value={hasData ? `${stats!.winRate.toFixed(1)}%` : '—'}
                  color={
                    hasData
                      ? (stats!.winRate >= 50 ? 'var(--green)' : 'var(--red)')
                      : 'var(--text-muted)'
                  }
                />
                <StatRow
                  label="Total PnL"
                  value={hasData ? formatPnl(stats!.totalPnl) : '—'}
                  color={
                    hasData
                      ? (stats!.totalPnl >= 0 ? 'var(--green)' : 'var(--red)')
                      : 'var(--text-muted)'
                  }
                />
                <StatRow
                  label="Expectancy"
                  value={hasData ? `${formatPnl(stats!.expectancy)} / trade` : '—'}
                  color={
                    hasData
                      ? (stats!.expectancy >= 0 ? 'var(--green)' : 'var(--red)')
                      : 'var(--text-muted)'
                  }
                />
                <StatRow
                  label="Best"
                  value={hasData ? formatPnl(stats!.bestTrade) : '—'}
                  color={hasData ? 'var(--green)' : 'var(--text-muted)'}
                />
                <StatRow
                  label="Worst"
                  value={hasData ? formatPnl(stats!.worstTrade) : '—'}
                  color={hasData ? 'var(--red)' : 'var(--text-muted)'}
                />
              </div>
            );
          })}
        </div>
      </div>

      <CumulativePnlChart
        strategyTrades={seriesTrades}
        colorForKey={intervalColor}
        title={`Equity — ${selectedPair} · ${strategyLabel}`}
      />
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: color ?? 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
