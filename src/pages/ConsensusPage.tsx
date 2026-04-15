import { useMemo, useState } from 'react';
import { useCurrentSignals } from '../hooks/useCurrentSignals';
import { usePairs } from '../hooks/usePairs';
import { useIntervals } from '../hooks/useIntervals';
import { computeConsensus } from '../utils/consensus';
import ConsensusCard from '../components/consensus/ConsensusCard';
import type { PairInfo, IntervalInfo } from '../api/client';

interface Props {
  onSelectStrategy: (name: string) => void;
}

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

export default function ConsensusPage({ onSelectStrategy }: Props) {
  const signalsQ = useCurrentSignals();
  const pairsQ = usePairs();
  const intervalsQ = useIntervals();

  const pairInfos: PairInfo[] = Array.isArray(pairsQ.data) ? pairsQ.data : [];
  const intervalInfos: IntervalInfo[] = Array.isArray(intervalsQ.data) ? intervalsQ.data : [];
  const signals = signalsQ.data ?? [];

  const [pairFilter, setPairFilter] = useState<Set<string>>(new Set());
  const [intervalFilter, setIntervalFilter] = useState<Set<string>>(new Set());

  const distinctPairs = useMemo(() => {
    const fromSignals = Array.from(new Set(signals.map(s => s.pair)));
    const base = fromSignals.length > 0 ? fromSignals : pairInfos.map(p => p.pair);
    return [...base].sort();
  }, [signals, pairInfos]);

  const distinctIntervals = useMemo(() => {
    const fromSignals = Array.from(new Set(signals.map(s => s.interval)));
    const base = fromSignals.length > 0 ? fromSignals : intervalInfos.map(i => i.label);
    return [...base].sort((a, b) => intervalToMinutes(a, intervalInfos) - intervalToMinutes(b, intervalInfos));
  }, [signals, intervalInfos]);

  const visiblePairs = useMemo(
    () => distinctPairs.filter(p => pairFilter.size === 0 || pairFilter.has(p)),
    [distinctPairs, pairFilter],
  );
  const visibleIntervals = useMemo(
    () => distinctIntervals.filter(i => intervalFilter.size === 0 || intervalFilter.has(i)),
    [distinctIntervals, intervalFilter],
  );

  const summaries = useMemo(() => {
    const out = [] as ReturnType<typeof computeConsensus>[];
    for (const pair of visiblePairs) {
      for (const interval of visibleIntervals) {
        out.push(computeConsensus(signals, pair, interval));
      }
    }
    return out;
  }, [signals, visiblePairs, visibleIntervals]);

  function toggleFilter(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  if (signalsQ.isLoading || pairsQ.isLoading || intervalsQ.isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        Loading consensus…
      </div>
    );
  }

  if (signalsQ.isError) {
    return (
      <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
        Failed to load consensus — is the backend reachable?
      </div>
    );
  }

  if (pairInfos.length === 0 || intervalInfos.length === 0) {
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
          <div className="label" style={{ marginBottom: 4 }}>Consensus</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Aggregated per (pair × interval) — confidence-weighted score plus raw BUY/HOLD/SELL counts across all 12 strategies.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {summaries.length} cards · refreshes every 30s
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 12,
        }}
      >
        {summaries.map(s => (
          <ConsensusCard
            key={`${s.pair}|${s.interval}`}
            summary={s}
            onSelectStrategy={onSelectStrategy}
          />
        ))}
      </div>
    </div>
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
