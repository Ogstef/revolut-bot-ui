import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TradeHistoryEntry } from '../../api/client';
import { exitReasonBreakdown } from '../../utils/analytics';
import { formatPnl } from '../../utils/format';

interface Props { trades: TradeHistoryEntry[]; }

const COLORS: Record<string, string> = {
  TP_HIT:      'var(--green)',
  SL_HIT:      'var(--red)',
  SIGNAL_EXIT: 'var(--amber)',
  MANUAL:      '#7a8fa6',
  UNKNOWN:     '#5a6a7a',
};

const LABELS: Record<string, string> = {
  TP_HIT:      'Take Profit',
  SL_HIT:      'Stop Loss',
  SIGNAL_EXIT: 'Signal Exit',
  MANUAL:      'Manual',
  UNKNOWN:     'Unknown',
};

export default function ExitReasonDonut({ trades }: Props) {
  const slices = exitReasonBreakdown(trades);
  const total = slices.reduce((s, x) => s + x.count, 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Exit Reasons</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{total} closed</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, alignItems: 'center', minHeight: 220 }}>
        {total === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 32 }}>
            No data
          </div>
        ) : (
          <>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="reason"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="var(--bg-surface)"
                  >
                    {slices.map(s => (
                      <Cell key={s.reason} fill={COLORS[s.reason] ?? '#7a8fa6'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ReasonTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {slices.map(s => {
                const pct = total === 0 ? 0 : (s.count / total) * 100;
                return (
                  <div key={s.reason} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 2,
                      background: COLORS[s.reason] ?? '#7a8fa6', flexShrink: 0,
                    }} />
                    <span style={{ color: 'var(--text-secondary)', minWidth: 78 }}>
                      {LABELS[s.reason] ?? s.reason}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>
                      {s.count}
                    </span>
                    <span style={{ color: 'var(--text-muted)', minWidth: 38, textAlign: 'right' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <span style={{ color: s.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                      {formatPnl(s.pnl)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReasonTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '6px 10px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{LABELS[d.reason] ?? d.reason}</div>
      <div style={{ color: 'var(--text-muted)' }}>{d.count} trades</div>
      <div style={{ color: d.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPnl(d.pnl)}</div>
    </div>
  );
}
