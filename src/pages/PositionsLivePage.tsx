import { useMemo, useState } from 'react';
import type { Position } from '../api/client';
import { useLivePositions } from '../hooks/useLivePositions';
import { formatPnl, formatPct, formatPrice, formatQty, formatTimeAgo } from '../utils/format';

interface Props {
  onSelectStrategy: (name: string) => void;
}

type SortKey =
  | 'displayName'
  | 'pair'
  | 'interval'
  | 'side'
  | 'entryPrice'
  | 'currentPrice'
  | 'quantity'
  | 'unrealisedPnl'
  | 'unrealisedPnlPct'
  | 'openedAt';

type SortDir = 'asc' | 'desc';

const NUMERIC_KEYS: SortKey[] = [
  'entryPrice',
  'currentPrice',
  'quantity',
  'unrealisedPnl',
  'unrealisedPnlPct',
];

export default function PositionsLivePage({ onSelectStrategy }: Props) {
  const positionsQ = useLivePositions();
  const [sortKey, setSortKey] = useState<SortKey>('unrealisedPnl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = positionsQ.data ?? [];

  const sorted = useMemo(() => {
    const mult = sortDir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => {
      if (NUMERIC_KEYS.includes(sortKey)) {
        const av = (a[sortKey as keyof Position] as number | undefined) ?? 0;
        const bv = (b[sortKey as keyof Position] as number | undefined) ?? 0;
        return (av - bv) * mult;
      }
      if (sortKey === 'openedAt') {
        // raw ISO string comparison — works because ISO-8601 is lexically ordered
        return a.openedAt.localeCompare(b.openedAt) * mult;
      }
      const av = String(a[sortKey as keyof Position] ?? '');
      const bv = String(b[sortKey as keyof Position] ?? '');
      return av.localeCompare(bv) * mult;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(NUMERIC_KEYS.includes(key) || key === 'openedAt' ? 'desc' : 'asc');
    }
  }

  function handleRowClick(pos: Position) {
    const name = pos.strategyName;
    if (!name) {
      console.warn('[PositionsLivePage] position missing strategyName', pos);
      onSelectStrategy('');
      return;
    }
    onSelectStrategy(name);
  }

  if (positionsQ.isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        Loading live positions…
      </div>
    );
  }

  if (positionsQ.isError) {
    return (
      <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
        Failed to load live positions — is the backend reachable?
      </div>
    );
  }

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Positions (Live)</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Every open position across all pair × strategy × interval combinations. Click a row to jump to that strategy's detail tab.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {rows.length} position{rows.length === 1 ? '' : 's'} · refreshes every 15s
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>⊘</div>
            No open positions right now.
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="Strategy"   k="displayName"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Pair"       k="pair"             sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Interval"   k="interval"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Side"       k="side"             sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Entry"      k="entryPrice"       sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <SortHeader label="Current"    k="currentPrice"     sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <SortHeader label="Qty"        k="quantity"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <th>TP / SL Progress</th>
                  <SortHeader label="Unreal. PnL"   k="unrealisedPnl"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <SortHeader label="Unreal. %"     k="unrealisedPnlPct" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <th>Reason</th>
                  <SortHeader label="Opened"     k="openedAt"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => (
                  <PositionRow
                    key={`${p.strategyName ?? 'unknown'}-${p.pair}-${p.interval ?? 'na'}-${p.id}`}
                    pos={p}
                    onClick={() => handleRowClick(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  align,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === k;
  return (
    <th
      onClick={() => onSort(k)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        textAlign: align ?? 'left',
        color: active ? 'var(--text-primary)' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {label} {active ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );
}

function PositionRow({ pos, onClick }: { pos: Position; onClick: () => void }) {
  const pnlPos = pos.unrealisedPnl >= 0;
  const range = pos.takeProfit - pos.stopLoss;
  const progress = range > 0 ? ((pos.currentPrice - pos.stopLoss) / range) * 100 : 50;
  const progressColor = progress > 66 ? 'var(--green)' : progress > 33 ? 'var(--amber)' : 'var(--red)';
  const tpDist = ((pos.takeProfit - pos.currentPrice) / pos.currentPrice) * 100;
  const slDist = ((pos.currentPrice - pos.stopLoss) / pos.currentPrice) * 100;

  return (
    <tr
      className="animate-fade-in"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      title={pos.strategyName ? `Open ${pos.displayName ?? pos.strategyName} detail tab` : undefined}
    >
      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
        {pos.displayName ?? pos.strategyName ?? '—'}
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{pos.pair}</td>
      <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        {pos.interval ?? '—'}
      </td>
      <td>
        <span className={`badge ${pos.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{pos.side}</span>
      </td>
      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatPrice(pos.entryPrice)}</td>
      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(pos.currentPrice)}</td>
      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 11 }}>{formatQty(pos.quantity)}</td>
      <td>
        <div style={{ minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
            <span style={{ color: 'var(--red)' }}>SL {formatPrice(pos.stopLoss)}</span>
            <span style={{ color: 'var(--green)' }}>TP {formatPrice(pos.takeProfit)}</span>
          </div>
          <div className="progress-bar" style={{ height: 4 }}>
            <div className="progress-fill" style={{
              width: `${Math.max(2, Math.min(98, progress))}%`,
              background: progressColor,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            <span>{slDist.toFixed(1)}% away</span>
            <span>{tpDist.toFixed(1)}% to TP</span>
          </div>
        </div>
      </td>
      <td style={{ textAlign: 'right', fontWeight: 700, color: pnlPos ? 'var(--green)' : 'var(--red)' }}
          className={pnlPos ? 'positive' : 'negative'}>
        {formatPnl(pos.unrealisedPnl)}
      </td>
      <td style={{ textAlign: 'right', fontSize: 11, color: pnlPos ? 'var(--green)' : 'var(--red)', opacity: 0.9 }}
          className={pnlPos ? 'positive' : 'negative'}>
        {formatPct(pos.unrealisedPnlPct)}
      </td>
      <td style={{ maxWidth: 220 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
             title={pos.signalReason}>
          {pos.signalReason}
        </div>
      </td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
        {formatTimeAgo(pos.openedAt)}
      </td>
    </tr>
  );
}
