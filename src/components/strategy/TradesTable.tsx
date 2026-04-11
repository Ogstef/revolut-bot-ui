import type { Trade } from '../../api/client';
import { formatPnl, formatPct, formatPrice, formatDateTime } from '../../utils/format';

interface Props {
  trades: Trade[] | undefined;
  isLoading: boolean;
}

const EXIT_LABELS: Record<string, { label: string; cls: string }> = {
  TP_HIT:      { label: 'Take Profit', cls: 'badge-green'   },
  SL_HIT:      { label: 'Stop Loss',   cls: 'badge-red'     },
  SIGNAL_EXIT: { label: 'Signal Exit', cls: 'badge-amber'   },
  MANUAL:      { label: 'Manual',      cls: 'badge-neutral' },
};

export default function TradesTable({ trades, isLoading }: Props) {
  const rows = trades ?? [];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">Recent Trades</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rows.length} shown</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>⊘</div>
            No trades yet
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pair / Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>PnL</th>
                <th>%</th>
                <th>Exit Reason</th>
                <th>Mode</th>
                <th>Closed At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => {
                const pos = t.pnl >= 0;
                const exit = EXIT_LABELS[t.exitReason] ?? { label: t.exitReason, cls: 'badge-neutral' };
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{t.pair}</span>
                        <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.side}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.entryPrice)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(t.exitPrice)}</td>
                    <td style={{ fontWeight: 700, color: pos ? 'var(--green)' : 'var(--red)' }}>
                      {formatPnl(t.pnl)}
                    </td>
                    <td style={{ color: pos ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
                      {formatPct(t.pnlPct)}
                    </td>
                    <td><span className={`badge ${exit.cls}`}>{exit.label}</span></td>
                    <td>
                      <span className={`badge ${t.tradingMode === 'LIVE' ? 'badge-red' : 'badge-amber'}`}>
                        {t.tradingMode}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(t.closedAt ?? t.executedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
