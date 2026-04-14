import { Fragment, useMemo, useState } from 'react';
import type { TradeHistoryEntry } from '../../api/client';
import { formatPnl, formatPct, formatPrice, formatDateTime, formatQty } from '../../utils/format';
import { formatDuration } from '../../utils/analytics';

interface Props {
  trades: TradeHistoryEntry[];
  isLoading: boolean;
}

const EXIT_LABELS: Record<string, { label: string; cls: string }> = {
  TP_HIT:      { label: 'Take Profit', cls: 'badge-green'   },
  SL_HIT:      { label: 'Stop Loss',   cls: 'badge-red'     },
  SIGNAL_EXIT: { label: 'Signal Exit', cls: 'badge-amber'   },
  MANUAL:      { label: 'Manual',      cls: 'badge-neutral' },
};

type SortKey = 'executedAt' | 'closedAt' | 'pnl' | 'pnlPct' | 'rMultiple' | 'holdingDurationSeconds';
type SortDir = 'asc' | 'desc';

export default function TradeHistoryTable({ trades, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('executedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const sorted = useMemo(() => {
    const arr = [...trades];
    arr.sort((a, b) => {
      const av = readSortValue(a, sortKey);
      const bv = readSortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [trades, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const toggleRow = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">Trade History</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{trades.length} rows</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 540 }}>
        {isLoading ? (
          <Loading />
        ) : sorted.length === 0 ? (
          <EmptyRow />
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 18 }}></th>
                <th>#</th>
                <th>Side</th>
                <SortHeader col="executedAt"             label="Opened"   active={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader col="closedAt"               label="Closed"   active={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader col="holdingDurationSeconds" label="Duration" active={sortKey} dir={sortDir} onClick={toggleSort} />
                <th>Entry</th>
                <th>Exit</th>
                <SortHeader col="pnl"        label="PnL"   active={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader col="pnlPct"     label="%"     active={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader col="rMultiple"  label="R"     active={sortKey} dir={sortDir} onClick={toggleSort} />
                <th>Exit</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => {
                const pos = (t.pnl ?? 0) >= 0;
                const exit = t.exitReason ? EXIT_LABELS[t.exitReason] ?? { label: t.exitReason, cls: 'badge-neutral' } : { label: '—', cls: 'badge-neutral' };
                const isOpen = expanded.has(t.id);
                return (
                  <Fragment key={t.id}>
                    <tr onClick={() => toggleRow(t.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 11 }}>
                        {isOpen ? '▾' : '▸'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t.id}</td>
                      <td>
                        <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.side}</span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(t.openedAt ?? t.executedAt)}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {t.closedAt ? formatDateTime(t.closedAt) : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDuration(t.holdingDurationSeconds)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.entryPrice)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.exitPrice)}</td>
                      <td style={{ fontWeight: 700, color: pos ? 'var(--green)' : 'var(--red)' }}>
                        {formatPnl(t.pnl)}
                      </td>
                      <td style={{ color: pos ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
                        {formatPct(t.pnlPct)}
                      </td>
                      <td style={{ color: pos ? 'var(--green)' : 'var(--red)', fontSize: 11, fontWeight: 600 }}>
                        {t.rMultiple == null ? '—' : `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R`}
                      </td>
                      <td><span className={`badge ${exit.cls}`}>{exit.label}</span></td>
                      <td>
                        <span className={`badge ${t.tradingMode === 'LIVE' ? 'badge-red' : 'badge-amber'}`}>
                          {t.tradingMode}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={13} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px' }}>
                          <ExpandedDetail t={t} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function readSortValue(t: TradeHistoryEntry, k: SortKey): number | null {
  switch (k) {
    case 'executedAt': return +new Date(t.executedAt);
    case 'closedAt':   return t.closedAt ? +new Date(t.closedAt) : null;
    case 'pnl':        return t.pnl;
    case 'pnlPct':     return t.pnlPct;
    case 'rMultiple':  return t.rMultiple;
    case 'holdingDurationSeconds': return t.holdingDurationSeconds;
  }
}

function SortHeader({ col, label, active, dir, onClick }: {
  col: SortKey; label: string; active: SortKey; dir: SortDir; onClick: (k: SortKey) => void;
}) {
  const isActive = col === active;
  const arrow = !isActive ? '' : dir === 'asc' ? ' ▲' : ' ▼';
  return (
    <th
      onClick={() => onClick(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', color: isActive ? 'var(--text-primary)' : undefined }}
    >
      {label}{arrow}
    </th>
  );
}

function ExpandedDetail({ t }: { t: TradeHistoryEntry }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <Block label="Entry signal reason">
        <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {t.entrySignalReason ?? '—'}
        </div>
      </Block>

      <Block label="Risk / Reward">
        <Row k="Take profit" v={formatPrice(t.takeProfit)} c="var(--green)" />
        <Row k="Stop loss"   v={formatPrice(t.stopLoss)}   c="var(--red)" />
        <Row k="Quantity"    v={formatQty(t.quantity)}     c="var(--text-secondary)" />
        <Row k="R-multiple"
             v={t.rMultiple == null ? '—' : `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(4)}R`}
             c={(t.rMultiple ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'} />
      </Block>

      <Block label="Timing">
        <Row k="Opened"   v={t.openedAt ? formatDateTime(t.openedAt) : '—'} c="var(--text-secondary)" />
        <Row k="Executed" v={formatDateTime(t.executedAt)} c="var(--text-secondary)" />
        <Row k="Closed"   v={t.closedAt ? formatDateTime(t.closedAt) : '—'} c="var(--text-secondary)" />
        <Row k="Duration" v={formatDuration(t.holdingDurationSeconds)} c="var(--blue)" />
      </Block>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</div>
    </div>
  );
}

function Row({ k, v, c }: { k: string; v: string; c: string; }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
      <span style={{ color: c, fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function Loading() {
  return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading history…</div>;
}

function EmptyRow() {
  return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 24, opacity: 0.4, marginBottom: 6 }}>∅</div>
      No trades match the current filters
    </div>
  );
}
