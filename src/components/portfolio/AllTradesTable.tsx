import { useState } from 'react';
import type { Trade } from '../../api/client';
import { strategyColor } from '../../utils/strategyMeta';
import { formatPnl, formatPct, formatPrice, formatDateTime } from '../../utils/format';


type EnrichedTrade = Trade & { strategyDisplayName: string };

interface Props {
  trades: EnrichedTrade[];
  isLoading: boolean;
}

const EXIT_LABELS: Record<string, { label: string; cls: string }> = {
  TP_HIT:      { label: 'Take Profit', cls: 'badge-green'   },
  SL_HIT:      { label: 'Stop Loss',   cls: 'badge-red'     },
  SIGNAL_EXIT: { label: 'Signal Exit', cls: 'badge-amber'   },
  MANUAL:      { label: 'Manual',      cls: 'badge-neutral' },
};

const PAGE_SIZE = 50;

export default function AllTradesTable({ trades, isLoading }: Props) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(trades.length / PAGE_SIZE);
  const rows = trades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalPnl = trades.reduce((s, t) => s + ((t.netPnl ?? t.pnl) ?? 0), 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">All Closed Trades</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {totalPnl >= 0 ? '+' : ''}€{Math.abs(totalPnl).toFixed(2)} combined
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{trades.length} trades</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>⊘</div>
            No closed trades yet
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Pair / Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>PnL</th>
                <th>%</th>
                <th>Exit Reason</th>
                <th>Mode</th>
                <th>Opened At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => <TradeRow key={`${t.strategyName}-${t.id}`} trade={t} />)}
            </tbody>
          </table>
        )}
      </div>

      {pageCount > 1 && (
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '3px 10px', fontSize: 11 }}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {page + 1} / {pageCount}
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '3px 10px', fontSize: 11 }}
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function TradeRow({ trade: t }: { trade: EnrichedTrade }) {
  const netVal = t.netPnl ?? t.pnl;
  const pos = (netVal ?? 0) >= 0;
  const hasFees = t.netPnl != null && t.netPnl !== t.pnl && Math.abs((t.pnl ?? 0) - t.netPnl) >= 0.005;
  const exit = EXIT_LABELS[t.exitReason] ?? { label: t.exitReason, cls: 'badge-neutral' };
  const color = strategyColor(t.strategyName);

  return (
    <tr style={{ background: (t.pnl ?? 0) > 0 && (netVal ?? 0) < 0 ? 'rgba(239,68,68,.06)' : undefined }}>
      <td>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color, padding: '2px 6px',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 2, whiteSpace: 'nowrap',
        }}>
          {t.strategyDisplayName}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{t.pair}</span>
          <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.side}</span>
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.entryPrice)}</td>
      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.exitPrice)}</td>
      <td>
        <span className="pnl-pair">
          <span className="net" style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
            {formatPnl(netVal)}
          </span>
          {hasFees && <span className="gross">gross {formatPnl(t.pnl)}</span>}
        </span>
      </td>
      <td style={{ color: pos ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
        {formatPct(t.netPnlPct ?? t.pnlPct)}
      </td>
      <td><span className={`badge ${exit.cls}`}>{exit.label}</span></td>
      <td>
        <span className={`badge ${t.tradingMode === 'LIVE' ? 'badge-red' : 'badge-amber'}`}>
          {t.tradingMode}
        </span>
      </td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {formatDateTime(t.executedAt)}
      </td>
    </tr>
  );
}
