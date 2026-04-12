import type { Signal } from '../../api/client';
import { getIndicatorMeta } from '../../utils/strategyMeta';
import { formatPrice, formatDateTime } from '../../utils/format';

interface Props {
  signals: Signal[] | undefined;
  isLoading: boolean;
  strategyName: string;
}

const SIGNAL_BADGE: Record<string, string> = {
  BUY:  'badge-green',
  SELL: 'badge-red',
  HOLD: 'badge-neutral',
};

export default function SignalHistory({ signals, isLoading, strategyName }: Props) {
  const rows = signals ?? [];
  const meta = getIndicatorMeta(strategyName);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">Recent Signals</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rows.length} shown</span>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
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
                {meta.rsiLabel      && <th>{meta.rsiLabel}</th>}
                {meta.emaShortLabel && <th>{meta.emaShortLabel}</th>}
                {meta.emaLongLabel  && <th>{meta.emaLongLabel}</th>}
                <th>Confidence</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <SignalRow key={s.id} signal={s} strategyName={strategyName} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SignalRow({ signal: s, strategyName }: { signal: Signal; strategyName: string }) {
  const meta = getIndicatorMeta(strategyName);

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

      {/* RSI / primary indicator */}
      {meta.rsiLabel && (
        <td>
          {s.rsi != null
            ? <RsiCell value={s.rsi} strategyName={strategyName} />
            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
      )}

      {/* emaShort */}
      {meta.emaShortLabel && (
        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {s.emaShort != null ? formatIndicatorValue(s.emaShort, strategyName, 'emaShort') : '—'}
        </td>
      )}

      {/* emaLong */}
      {meta.emaLongLabel && (
        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {s.emaLong != null ? formatIndicatorValue(s.emaLong, strategyName, 'emaLong') : '—'}
        </td>
      )}

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

function RsiCell({ value, strategyName }: { value: number; strategyName: string }) {
  // ADX: highlight strength — <20 no trend, >25 strong
  if (strategyName === 'ADX_DI') {
    const strong = value >= 25;
    const color = strong ? 'var(--green)' : value >= 20 ? 'var(--amber)' : 'var(--text-muted)';
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color }}>
        {value.toFixed(1)}
        <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 400 }}>
          {strong ? 'STRONG' : value >= 20 ? 'WEAK' : 'NO TREND'}
        </span>
      </span>
    );
  }
  // CCI: can be outside 0–100, show ±
  if (strategyName === 'CCI') {
    const color = value >= 100 ? 'var(--green)' : value <= -100 ? 'var(--red)' : 'var(--text-secondary)';
    return (
      <span style={{ fontSize: 12, fontWeight: 600, color }}>
        {value >= 0 ? '+' : ''}{value.toFixed(0)}
      </span>
    );
  }
  // Standard RSI colouring
  const color = value >= 70 ? 'var(--red)' : value <= 30 ? 'var(--green)' : 'var(--text-secondary)';
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color }}>{value.toFixed(1)}</span>
  );
}

function formatIndicatorValue(value: number, strategyName: string, field: 'emaShort' | 'emaLong'): string {
  // StochRSI emaShort is already ×100, show as integer
  if (strategyName === 'STOCH_RSI' && field === 'emaShort') return String(Math.round(value));
  // Price-level values (EMA, SAR, Bollinger bands) — use EUR format
  if (['EMA_CROSSOVER', 'BOLLINGER', 'TRIPLE_EMA', 'PARABOLIC_SAR'].includes(strategyName)) {
    return `€${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toFixed(4);
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
