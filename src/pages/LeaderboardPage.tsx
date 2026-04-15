import { useEffect, useMemo, useRef, useState } from 'react';
import type { TripleStats, PairInfo, IntervalInfo } from '../api/client';
import { useAllTripleStats } from '../hooks/useAllTripleStats';
import { usePairs } from '../hooks/usePairs';
import { useIntervals } from '../hooks/useIntervals';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import { formatPnl } from '../utils/format';
import TripleHeatmap from '../components/leaderboard/TripleHeatmap';

interface Props {
  onSelectStrategy: (name: string) => void;
}

type SortKey =
  | 'totalTrades'
  | 'winRate'
  | 'totalPnl'
  | 'averageWin'
  | 'averageLoss'
  | 'expectancy'
  | 'bestTrade'
  | 'worstTrade'
  | 'openPositions';

function rowKey(r: TripleStats): string {
  return `${r.pair}|${r.strategy}|${r.interval}`;
}

// Label → minutes, so rows in the heatmap sort by timeframe length.
// Supports the documented Revolut intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w.
function intervalToMinutes(label: string, intervalInfos: IntervalInfo[]): number {
  const found = intervalInfos.find(i => i.label === label);
  if (found) return found.minutes;
  const m = label.match(/^(\d+)([mhdw])$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = parseInt(m[1], 10);
  switch (m[2].toLowerCase()) {
    case 'm': return n;
    case 'h': return n * 60;
    case 'd': return n * 60 * 24;
    case 'w': return n * 60 * 24 * 7;
    default:  return Number.MAX_SAFE_INTEGER;
  }
}

export default function LeaderboardPage({ onSelectStrategy }: Props) {
  const statsQ = useAllTripleStats();
  const pairsQ = usePairs();
  const intervalsQ = useIntervals();

  const pairInfos: PairInfo[] = Array.isArray(pairsQ.data) ? pairsQ.data : [];
  const intervalInfos: IntervalInfo[] = Array.isArray(intervalsQ.data) ? intervalsQ.data : [];
  const data: TripleStats[] = Array.isArray(statsQ.data) ? statsQ.data : [];

  const [pairFilter, setPairFilter] = useState<Set<string>>(new Set());
  const [intervalFilter, setIntervalFilter] = useState<Set<string>>(new Set());
  const [strategyFilter, setStrategyFilter] = useState<Set<string>>(new Set());

  const [sortKey, setSortKey] = useState<SortKey>('totalPnl');
  const [sortDesc, setSortDesc] = useState(true);

  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement | null>());

  // Distinct pair + interval values from data (fall back to config when stats empty)
  const distinctPairs = useMemo(() => {
    const fromData = Array.from(new Set(data.map(d => d.pair)));
    const base = fromData.length > 0 ? fromData : pairInfos.map(p => p.pair);
    return [...base].sort();
  }, [data, pairInfos]);

  const distinctIntervals = useMemo(() => {
    const fromData = Array.from(new Set(data.map(d => d.interval)));
    const base = fromData.length > 0 ? fromData : intervalInfos.map(i => i.label);
    return [...base].sort((a, b) => intervalToMinutes(a, intervalInfos) - intervalToMinutes(b, intervalInfos));
  }, [data, intervalInfos]);

  // Apply filters
  const filtered = useMemo(() => {
    return data.filter(r => {
      if (pairFilter.size > 0 && !pairFilter.has(r.pair)) return false;
      if (intervalFilter.size > 0 && !intervalFilter.has(r.interval)) return false;
      if (strategyFilter.size > 0 && !strategyFilter.has(r.strategy)) return false;
      return true;
    });
  }, [data, pairFilter, intervalFilter, strategyFilter]);

  // Top-3 rank (1/2/3) per highlighted numeric column (over the filtered set)
  const top3 = useMemo(() => {
    const cols: SortKey[] = ['totalPnl', 'winRate', 'expectancy', 'bestTrade'];
    const out: Record<string, Map<string, 1 | 2 | 3>> = {};
    for (const c of cols) {
      const ranked = [...filtered]
        .filter(r => r.totalTrades > 0)
        .sort((a, b) => (b[c] as number) - (a[c] as number))
        .slice(0, 3);
      const map = new Map<string, 1 | 2 | 3>();
      ranked.forEach((r, i) => map.set(rowKey(r), (i + 1) as 1 | 2 | 3));
      out[c] = map;
    }
    return out;
  }, [filtered]);

  function getSortValue(r: TripleStats, k: SortKey): number {
    return (r[k] as number | undefined) ?? -Infinity;
  }

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      return sortDesc ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, sortKey, sortDesc]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDesc(d => !d);
    else { setSortKey(k); setSortDesc(true); }
  }

  function toggleFilter(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function scrollToRow(row: TripleStats) {
    const key = rowKey(row);
    setHighlightKey(key);
    setFlashKey(key);
    const el = rowRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  useEffect(() => {
    if (flashKey == null) return;
    const t = setTimeout(() => setFlashKey(null), 1800);
    return () => clearTimeout(t);
  }, [flashKey]);

  if (statsQ.isLoading || pairsQ.isLoading || intervalsQ.isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        Loading leaderboard…
      </div>
    );
  }

  if (statsQ.isError) {
    return (
      <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
        Failed to load leaderboard — is the backend reachable?
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        No stats yet — the bot needs to close some trades first.
      </div>
    );
  }

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Grand Leaderboard</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Every (pair × strategy × interval) virtual portfolio ranked side-by-side.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {sorted.length} / {data.length} rows · refreshes every 30s
        </div>
      </div>

      <FilterBar
        title="Pair"
        options={distinctPairs}
        active={pairFilter}
        onToggle={v => toggleFilter(pairFilter, setPairFilter, v)}
        onClear={() => setPairFilter(new Set())}
      />
      <FilterBar
        title="Interval"
        options={distinctIntervals}
        active={intervalFilter}
        onToggle={v => toggleFilter(intervalFilter, setIntervalFilter, v)}
        onClear={() => setIntervalFilter(new Set())}
      />
      <FilterBar
        title="Strategy"
        options={KNOWN_STRATEGIES.map(s => s.name)}
        labels={Object.fromEntries(KNOWN_STRATEGIES.map(s => [s.name, s.displayName]))}
        active={strategyFilter}
        onToggle={v => toggleFilter(strategyFilter, setStrategyFilter, v)}
        onClear={() => setStrategyFilter(new Set())}
      />

      {/* SECTION A — Heatmaps per strategy */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 12,
      }}>
        {KNOWN_STRATEGIES
          .filter(s => strategyFilter.size === 0 || strategyFilter.has(s.name))
          .map(s => {
            const rows = filtered.filter(r => r.strategy === s.name);
            const pairsForGrid = distinctPairs.filter(p => pairFilter.size === 0 || pairFilter.has(p));
            const intervalsForGrid = distinctIntervals.filter(i => intervalFilter.size === 0 || intervalFilter.has(i));
            return (
              <div key={s.name} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header">
                  <button
                    onClick={() => onSelectStrategy(s.name)}
                    title={`Open ${s.displayName} detail tab`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                    }}
                  >
                    {s.displayName}
                  </button>
                </div>
                <div style={{ padding: 10 }}>
                  <TripleHeatmap
                    data={rows}
                    pairs={pairsForGrid}
                    intervals={intervalsForGrid}
                    onCellClick={scrollToRow}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* SECTION B — Ranked table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header">
          <span className="label">All Triples</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click column to sort · click row to open strategy</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 14 }}>Strategy</th>
                <th>Pair</th>
                <th>Interval</th>
                <SortHeader label="Trades"     col="totalTrades"    sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Win Rate"   col="winRate"        sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Total PnL"  col="totalPnl"       sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Avg Win"    col="averageWin"     sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Avg Loss"   col="averageLoss"    sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Expectancy" col="expectancy"     sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Best"       col="bestTrade"      sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Worst"      col="worstTrade"     sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <SortHeader label="Open"       col="openPositions"  sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                <th>CB</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const k = rowKey(r);
                const rankPnl  = top3.totalPnl.get(k)    ?? null;
                const rankWr   = top3.winRate.get(k)     ?? null;
                const rankExp  = top3.expectancy.get(k)  ?? null;
                const rankBest = top3.bestTrade.get(k)   ?? null;
                const isHighlight = highlightKey === k;
                const isFlash = flashKey === k;
                return (
                  <tr
                    key={k}
                    ref={el => { rowRefs.current.set(k, el); }}
                    onClick={() => onSelectStrategy(r.strategy)}
                    style={{
                      cursor: 'pointer',
                      background: isFlash
                        ? 'rgba(0,230,118,0.18)'
                        : isHighlight
                          ? 'rgba(0,230,118,0.06)'
                          : rankPnl === 1 ? 'rgba(0,230,118,0.03)' : undefined,
                      borderLeft: rankPnl != null ? '3px solid var(--green)' : '3px solid transparent',
                      transition: 'background 300ms ease',
                    }}
                  >
                    <td style={{ paddingLeft: 14, fontWeight: 600 }}>{r.displayName}</td>
                    <td className="mono">{r.pair}</td>
                    <td className="mono">{r.interval}</td>
                    <td>{r.totalTrades.toLocaleString('en-US')}</td>
                    <RankedCell
                      rank={rankWr}
                      format={() => `${r.winRate.toFixed(1)}%`}
                      color={r.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
                    />
                    <RankedCell
                      rank={rankPnl}
                      format={() => formatPnl(r.totalPnl)}
                      color={r.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
                    />
                    <td style={{ color: 'var(--green)' }}>{formatPnl(r.averageWin)}</td>
                    <td style={{ color: 'var(--red)' }}>{formatPnl(r.averageLoss)}</td>
                    <RankedCell
                      rank={rankExp}
                      format={() => formatPnl(r.expectancy)}
                      color={r.expectancy >= 0 ? 'var(--green)' : 'var(--red)'}
                      suffix=" / trade"
                    />
                    <RankedCell
                      rank={rankBest}
                      format={() => formatPnl(r.bestTrade)}
                      color="var(--green)"
                    />
                    <td style={{ color: 'var(--red)' }}>{formatPnl(r.worstTrade)}</td>
                    <td style={{
                      fontWeight: r.openPositions > 0 ? 700 : 400,
                      color: r.openPositions > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {r.openPositions}
                    </td>
                    <td>
                      {r.circuitBreakerActive
                        ? <span className="badge badge-red animate-blink">CB</span>
                        : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, col, sortKey, sortDesc, onClick }: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDesc: boolean;
  onClick: (c: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onClick(col)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? 'var(--text-primary)' : undefined,
      }}
    >
      {label} {active ? (sortDesc ? '▼' : '▲') : ''}
    </th>
  );
}

function RankedCell({ rank, format, color, suffix }: {
  rank: 1 | 2 | 3 | null;
  format: () => string;
  color: string;
  suffix?: string;
}) {
  const highlight = rank != null;
  return (
    <td>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {rank != null && (
          <span style={{
            display: 'inline-block',
            minWidth: 14,
            height: 14,
            lineHeight: '14px',
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 700,
            borderRadius: '50%',
            background: rank === 1 ? 'var(--green)' : `${color}30`,
            color: rank === 1 ? '#0b0f14' : color,
          }}>
            {rank}
          </span>
        )}
        <span style={{
          color,
          fontWeight: highlight ? 700 : 400,
        }}>
          {format()}{suffix ?? ''}
        </span>
      </span>
    </td>
  );
}

function FilterBar({ title, options, active, onToggle, onClear, labels }: {
  title: string;
  options: string[];
  active: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
  labels?: Record<string, string>;
}) {
  if (options.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span className="label" style={{ minWidth: 62 }}>{title}</span>
      {options.map(opt => {
        const on = active.has(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`badge ${on ? 'badge-green' : 'badge-neutral'}`}
            style={{
              cursor: 'pointer',
              border: on ? '1px solid var(--green)' : '1px solid transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={onClear}
          className="badge badge-neutral"
          style={{ cursor: 'pointer', fontSize: 10 }}
          title="Clear filter"
        >
          clear
        </button>
      )}
    </div>
  );
}
