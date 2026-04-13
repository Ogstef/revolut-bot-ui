import type { Position } from '../../api/client';
import { strategyColor } from '../../utils/strategyMeta';
import { formatPnl, formatPct, formatPrice, formatQty, formatDateTime } from '../../utils/format';

type EnrichedPosition = Position & { strategyName: string; strategyDisplayName: string };

interface Props {
  positions: EnrichedPosition[];
  isLoading: boolean;
}

export default function AllPositionsTable({ positions, isLoading }: Props) {
  const sorted = [...positions].sort((a, b) => b.unrealisedPnl - a.unrealisedPnl);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">All Open Positions</span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: sorted.length > 0 ? 'var(--amber)' : 'var(--text-muted)',
        }}>
          {sorted.length} open
        </span>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>⊘</div>
            No open positions across all strategies
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Pair / Side</th>
                <th>Entry</th>
                <th>Current</th>
                <th>Qty</th>
                <th>TP / SL Progress</th>
                <th>Unreal. PnL</th>
                <th>Signal</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => <PositionRow key={`${p.strategyName}-${p.id}`} pos={p} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PositionRow({ pos }: { pos: EnrichedPosition }) {
  const pnlPos = pos.unrealisedPnl >= 0;
  const range = pos.takeProfit - pos.stopLoss;
  const progress = range > 0 ? ((pos.currentPrice - pos.stopLoss) / range) * 100 : 50;
  const progressColor = progress > 66 ? 'var(--green)' : progress > 33 ? 'var(--amber)' : 'var(--red)';
  const tpDist = ((pos.takeProfit - pos.currentPrice) / pos.currentPrice) * 100;
  const slDist = ((pos.currentPrice - pos.stopLoss) / pos.currentPrice) * 100;
  const color = strategyColor(pos.strategyName);

  return (
    <tr className="animate-fade-in">
      <td>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color, padding: '2px 6px',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}>
          {pos.strategyDisplayName}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{pos.pair}</span>
          <span className={`badge ${pos.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{pos.side}</span>
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(pos.entryPrice)}</td>
      <td style={{ fontWeight: 600 }}>{formatPrice(pos.currentPrice)}</td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatQty(pos.quantity)}</td>
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
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: pnlPos ? 'var(--green)' : 'var(--red)' }}>
            {formatPnl(pos.unrealisedPnl)}
          </span>
          <span style={{ fontSize: 10, color: pnlPos ? 'var(--green)' : 'var(--red)', opacity: 0.7 }}>
            {formatPct(pos.unrealisedPnlPct)}
          </span>
        </div>
      </td>
      <td style={{ maxWidth: 180 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pos.signalReason}
        </div>
      </td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {formatDateTime(pos.openedAt)}
      </td>
    </tr>
  );
}
