import type { PnlBreakdown as PnlBreakdownType } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface Props {
  pnl: PnlBreakdownType | undefined;
  isLoading: boolean;
  dailyOverride?: number;
}

type Period = { label: string; grossKey: keyof PnlBreakdownType; netKey: keyof PnlBreakdownType };

const PERIODS: Period[] = [
  { label: 'Daily',    grossKey: 'daily',    netKey: 'dailyNet'    },
  { label: 'Weekly',   grossKey: 'weekly',   netKey: 'weeklyNet'   },
  { label: 'Monthly',  grossKey: 'monthly',  netKey: 'monthlyNet'  },
  { label: 'All Time', grossKey: 'allTime',  netKey: 'allTimeNet'  },
];

export default function PnlBreakdown({ pnl, isLoading, dailyOverride }: Props) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">PnL Breakdown</span>
      </div>

      {isLoading ? (
        <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {PERIODS.map(({ label, grossKey, netKey }, i) => {
            const gross = grossKey === 'daily' && dailyOverride != null
              ? dailyOverride
              : (pnl?.[grossKey] ?? 0);
            const net = netKey === 'dailyNet' && dailyOverride != null
              ? dailyOverride
              : (pnl?.[netKey] ?? gross);
            const pos = net >= 0;
            const hasFees = Math.abs(gross - net) >= 0.005;
            const borderTop = i >= 2 ? '1px solid var(--border)' : undefined;
            const borderLeft = i % 2 === 1 ? '1px solid var(--border)' : undefined;
            return (
              <div key={label} style={{ padding: '12px 16px', borderTop, borderLeft }}>
                <div className="label" style={{ marginBottom: 4 }}>{label}</div>
                <span className="pnl-pair">
                  <span className="net" style={{
                    fontSize: 16,
                    fontFamily: 'var(--font-display)',
                    color: pos ? 'var(--green)' : 'var(--red)',
                    textShadow: pos ? '0 0 8px rgba(0,230,118,0.3)' : '0 0 8px rgba(255,61,90,0.3)',
                  }}>
                    {formatPnl(net)}
                  </span>
                  {hasFees && (
                    <span className="gross">gross {formatPnl(gross)}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
