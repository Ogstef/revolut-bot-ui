import type { Stats, PnlBreakdown } from '../api/client';
import { formatPnl } from '../utils/format';

interface Props {
  stats: Stats | undefined;
  pnl: PnlBreakdown | undefined;
}

export default function StatsPanel({ stats, pnl }: Props) {
  const winRate = stats?.winRate ?? 0;
  const expectancy = stats?.expectancy ?? 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="card-header">
        <span className="label">Performance</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{stats?.totalTrades ?? 0} trades</span>
      </div>

      {/* Expectancy — headline metric */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="label" style={{ marginBottom: 4 }}>Expectancy</div>
        <div className={`value-lg ${expectancy >= 0 ? 'positive glow-green' : 'negative glow-red'}`}>
          {formatPnl(expectancy)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>avg EUR per trade</div>
      </div>

      {/* Win Rate bar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span className="label">Win Rate</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>
            {winRate.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${winRate}%`,
              background: winRate >= 50
                ? 'linear-gradient(90deg, var(--green-dim), var(--green))'
                : 'linear-gradient(90deg, var(--red-dim), var(--red))',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--text-muted)' }}>
          <span>✓ {stats?.winningTrades ?? 0} wins</span>
          <span>✗ {stats?.losingTrades ?? 0} losses</span>
        </div>
      </div>

      {/* Grid stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <StatCell label="Total PnL" value={formatPnl(stats?.totalPnl ?? 0)} positive={(stats?.totalPnl ?? 0) >= 0} />
        <StatCell label="Avg Win" value={formatPnl(stats?.averageWin ?? 0)} positive={true} border="left" />
        <StatCell label="Best Trade" value={formatPnl(stats?.bestTrade ?? 0)} positive={true} border="top" />
        <StatCell label="Worst Trade" value={formatPnl(stats?.worstTrade ?? 0)} positive={false} border="top-left" />
      </div>

      {/* PnL breakdown */}
      {pnl && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '8px 14px 6px' }}>
            <span className="label">PnL Breakdown</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {([
              ['Daily', pnl.daily],
              ['Weekly', pnl.weekly],
              ['Monthly', pnl.monthly],
              ['All Time', pnl.allTime],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} style={{
                padding: '6px 14px 10px',
                borderRight: '1px solid var(--border)',
              }}>
                <div className="label" style={{ marginBottom: 3 }}>{label}</div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: val >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {formatPnl(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label, value, positive, border,
}: {
  label: string; value: string; positive: boolean; border?: string;
}) {
  return (
    <div style={{
      padding: '8px 14px',
      borderTop: border?.includes('top') ? '1px solid var(--border)' : undefined,
      borderLeft: border?.includes('left') ? '1px solid var(--border)' : undefined,
    }}>
      <div className="label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: positive ? 'var(--green)' : 'var(--red)' }}>
        {value}
      </div>
    </div>
  );
}
