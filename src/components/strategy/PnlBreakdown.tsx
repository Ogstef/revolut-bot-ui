import type { PnlBreakdown as PnlBreakdownType } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface Props {
  pnl: PnlBreakdownType | undefined;
  isLoading: boolean;
}

export default function PnlBreakdown({ pnl, isLoading }: Props) {
  const periods: [string, keyof PnlBreakdownType][] = [
    ['Daily',    'daily'],
    ['Weekly',   'weekly'],
    ['Monthly',  'monthly'],
    ['All Time', 'allTime'],
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">PnL Breakdown</span>
      </div>

      {isLoading ? (
        <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {periods.map(([label, key], i) => {
            const val = pnl?.[key] ?? 0;
            const pos = val >= 0;
            const borderTop = i >= 2 ? '1px solid var(--border)' : undefined;
            const borderLeft = i % 2 === 1 ? '1px solid var(--border)' : undefined;
            return (
              <div key={label} style={{ padding: '12px 16px', borderTop, borderLeft }}>
                <div className="label" style={{ marginBottom: 4 }}>{label}</div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: pos ? 'var(--green)' : 'var(--red)',
                  textShadow: pos ? '0 0 8px rgba(0,230,118,0.3)' : '0 0 8px rgba(255,61,90,0.3)',
                }}>
                  {formatPnl(val)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
