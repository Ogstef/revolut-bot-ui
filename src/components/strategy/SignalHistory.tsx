import type { Signal } from '../../api/client';
import { formatPrice, formatDateTime } from '../../utils/format';

interface Props {
  signals: Signal[] | undefined;
  isLoading: boolean;
}

const SIGNAL_BADGE: Record<string, string> = {
  BUY:  'badge-green',
  SELL: 'badge-red',
  HOLD: 'badge-neutral',
};

export default function SignalHistory({ signals, isLoading }: Props) {
  const rows = signals ?? [];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">Recent Signals</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rows.length} shown</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>⊘</div>
            No signals yet
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Signal</th>
                <th>Price</th>
                <th>RSI</th>
                <th>EMA Short</th>
                <th>EMA Long</th>
                <th>Confidence</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <SignalRow key={s.id} signal={s} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SignalRow({ signal: s }: { signal: Signal }) {
  return (
    <tr>
      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {formatDateTime(s.createdAt)}
      </td>
      <td>
        <span className={`badge ${SIGNAL_BADGE[s.signalType] ?? 'badge-neutral'}`}>
          {s.signalType}
        </span>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{formatPrice(s.currentPrice)}</td>
      <td>
        {s.rsi != null ? (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: s.rsi >= 70 ? 'var(--red)' : s.rsi <= 30 ? 'var(--green)' : 'var(--text-secondary)',
          }}>
            {s.rsi.toFixed(1)}
          </span>
        ) : '—'}
      </td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {s.emaShort != null ? formatPrice(s.emaShort) : '—'}
      </td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {s.emaLong != null ? formatPrice(s.emaLong) : '—'}
      </td>
      <td>
        <ConfidenceBar value={s.confidence} />
      </td>
      <td style={{ maxWidth: 260 }}>
        <div style={{
          fontSize: 11, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={s.reason}>
          {s.reason}
        </div>
      </td>
    </tr>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div className="progress-bar" style={{ flex: 1, height: 4 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, minWidth: 24 }}>{pct}%</span>
    </div>
  );
}
