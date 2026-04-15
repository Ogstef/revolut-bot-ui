import { useMemo, useState, Fragment } from 'react';
import type { CurrentSignal, IntervalInfo, PairInfo } from '../api/client';
import { useCurrentSignals } from '../hooks/useCurrentSignals';
import { usePairs } from '../hooks/usePairs';
import { useIntervals } from '../hooks/useIntervals';
import { KNOWN_STRATEGIES, getIndicatorMeta } from '../utils/strategyMeta';
import { formatPrice } from '../utils/format';

interface Props {
  onSelectStrategy: (name: string) => void;
}

const BADGE_BY_SIGNAL: Record<string, string> = {
  BUY: 'badge-green',
  SELL: 'badge-red',
  HOLD: 'badge-amber',
};

type CellKey = string; // `${pair}|${interval}|${strategy}`

function cellKey(pair: string, interval: string, strategy: string): CellKey {
  return `${pair}|${interval}|${strategy}`;
}

export default function CurrentSignalsPage({ onSelectStrategy }: Props) {
  const signalsQ = useCurrentSignals();
  const pairsQ = usePairs();
  const intervalsQ = useIntervals();

  const [expanded, setExpanded] = useState<CellKey | null>(null);

  const byKey = useMemo(() => {
    const map = new Map<CellKey, CurrentSignal>();
    (signalsQ.data ?? []).forEach(s => {
      map.set(cellKey(s.pair, s.interval, s.strategy), s);
    });
    return map;
  }, [signalsQ.data]);

  const pairs: PairInfo[] = Array.isArray(pairsQ.data) ? pairsQ.data : [];
  const intervals: IntervalInfo[] = Array.isArray(intervalsQ.data) ? intervalsQ.data : [];

  if (signalsQ.isLoading || pairsQ.isLoading || intervalsQ.isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        Loading current signals…
      </div>
    );
  }

  if (signalsQ.isError) {
    return (
      <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
        Failed to load current signals — is the backend reachable?
      </div>
    );
  }

  if (pairs.length === 0 || intervals.length === 0) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        No pairs or intervals configured.
      </div>
    );
  }

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Current Signals</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Latest evaluation per pair × strategy × interval. Click a cell to see the reason and indicators.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {signalsQ.data?.length ?? 0} cells · refreshes every 30s
        </div>
      </div>

      {pairs.map(pairInfo => (
        <PairMatrix
          key={pairInfo.pair}
          pair={pairInfo}
          intervals={intervals}
          byKey={byKey}
          expanded={expanded}
          onToggleCell={(key) => setExpanded(prev => (prev === key ? null : key))}
          onSelectStrategy={onSelectStrategy}
        />
      ))}
    </div>
  );
}

function PairMatrix({
  pair,
  intervals,
  byKey,
  expanded,
  onToggleCell,
  onSelectStrategy,
}: {
  pair: PairInfo;
  intervals: IntervalInfo[];
  byKey: Map<CellKey, CurrentSignal>;
  expanded: CellKey | null;
  onToggleCell: (key: CellKey) => void;
  onSelectStrategy: (name: string) => void;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}>
          {pair.pair}
        </span>
        <span className="label" style={{ marginLeft: 12 }}>current signals per interval</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 140 }}>Strategy</th>
              {intervals.map(iv => (
                <th key={iv.label} style={{ textAlign: 'center', minWidth: 90 }}>{iv.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KNOWN_STRATEGIES.map(s => {
              const expandedCellInThisRow = intervals.find(iv => expanded === cellKey(pair.pair, iv.label, s.name));
              const expandedSignal = expandedCellInThisRow
                ? byKey.get(cellKey(pair.pair, expandedCellInThisRow.label, s.name))
                : undefined;

              return (
                <Fragment key={s.name}>
                  <tr>
                    <td>
                      <button
                        onClick={() => onSelectStrategy(s.name)}
                        title={`Open ${s.displayName} detail tab`}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {s.displayName}
                      </button>
                    </td>
                    {intervals.map(iv => {
                      const key = cellKey(pair.pair, iv.label, s.name);
                      const sig = byKey.get(key);
                      const type = sig?.signalType ?? null;
                      const badgeClass = type ? (BADGE_BY_SIGNAL[type] ?? 'badge-neutral') : 'badge-neutral';
                      const isActive = expanded === key;
                      return (
                        <td key={iv.label} style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onToggleCell(key)}
                            className={`badge ${badgeClass}`}
                            style={{
                              border: isActive ? '1px solid var(--text-primary)' : '1px solid transparent',
                              cursor: 'pointer',
                              minWidth: 54,
                            }}
                          >
                            {type ?? '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  {expandedSignal && expandedCellInThisRow && (
                    <tr>
                      <td
                        colSpan={intervals.length + 1}
                        style={{
                          background: 'var(--bg-elevated)',
                          borderTop: '1px solid var(--border)',
                          borderBottom: '1px solid var(--border)',
                          padding: 14,
                        }}
                      >
                        <ExpandedDetails
                          signal={expandedSignal}
                          intervalLabel={expandedCellInThisRow.label}
                          strategyName={s.name}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandedDetails({
  signal,
  intervalLabel,
  strategyName,
}: {
  signal: CurrentSignal;
  intervalLabel: string;
  strategyName: string;
}) {
  const meta = getIndicatorMeta(strategyName);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, fontSize: 11 }}>
        <span className="label">{signal.pair} · {intervalLabel} · {signal.displayName}</span>
        {signal.evaluatedAt && (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Evaluated {timeAgo(signal.evaluatedAt)}
          </span>
        )}
        {signal.currentPrice != null && (
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Price {formatPrice(signal.currentPrice)}
          </span>
        )}
      </div>

      {signal.reason ? (
        <div style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '8px 10px',
        }}>
          {signal.reason}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          No signal evaluated yet for this triple.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
        {signal.confidence != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
            <span className="label">Confidence</span>
            <ConfidenceBar value={signal.confidence} />
          </div>
        )}
        {meta.rsiLabel && signal.rsi != null && (
          <IndicatorPill label={meta.rsiLabel} value={formatIndicator(signal.rsi, strategyName, 'rsi')} />
        )}
        {meta.emaShortLabel && signal.emaShort != null && (
          <IndicatorPill label={meta.emaShortLabel} value={formatIndicator(signal.emaShort, strategyName, 'emaShort')} />
        )}
        {meta.emaLongLabel && signal.emaLong != null && (
          <IndicatorPill label={meta.emaLongLabel} value={formatIndicator(signal.emaLong, strategyName, 'emaLong')} />
        )}
      </div>
    </div>
  );
}

function IndicatorPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="label" style={{ fontSize: 9 }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <div className="progress-bar" style={{ flex: 1, height: 4 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, minWidth: 28 }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

function formatIndicator(value: number, strategyName: string, field: 'emaShort' | 'emaLong' | 'rsi'): string {
  if (strategyName === 'STOCH_RSI' && field === 'emaShort') return String(Math.round(value));
  if (field !== 'rsi' && ['EMA_CROSSOVER', 'BOLLINGER', 'TRIPLE_EMA', 'PARABOLIC_SAR', 'DONCHIAN', 'ICHIMOKU'].includes(strategyName)) {
    return `€${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (field === 'rsi' && strategyName === 'CCI') {
    return (value >= 0 ? '+' : '') + value.toFixed(0);
  }
  return value.toFixed(2);
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}
