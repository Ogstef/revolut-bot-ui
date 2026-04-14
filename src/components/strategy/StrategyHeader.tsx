import type { Stats, PnlBreakdown, StrategyInfo } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface Props {
  info?: StrategyInfo;
  stats?: Stats;
  pnl?: PnlBreakdown;
}

export default function StrategyHeader({ info, stats, pnl }: Props) {
  const expectancy = stats?.expectancy ?? 0;
  const winRate = stats?.winRate ?? 0;

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0,
      }}>
        {/* Daily PnL — prefer the fresher 15s source (info.dailyPnl) over the 60s pnl endpoint */}
        <MetricBlock
          label="Daily PnL"
          value={formatPnl(info?.dailyPnl ?? pnl?.daily ?? 0)}
          valueColor={(info?.dailyPnl ?? pnl?.daily ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'}
          glow={(info?.dailyPnl ?? pnl?.daily ?? 0) >= 0}
        />

        <Divider />

        {/* Open Positions */}
        <MetricBlock
          label="Open Positions"
          value={String(info?.openPositions ?? 0)}
          valueColor="var(--blue)"
        />

        <Divider />

        {/* Win Rate */}
        <MetricBlock
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          valueColor={winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${stats?.winningTrades ?? 0}W / ${stats?.losingTrades ?? 0}L`}
        />

        <Divider />

        {/* Expectancy — headline */}
        <MetricBlock
          label="Expectancy"
          value={`${formatPnl(expectancy)} / trade`}
          valueColor={expectancy >= 0 ? 'var(--green)' : 'var(--red)'}
          glow={expectancy >= 0}
          large
        />

        <Divider />

        {/* Best / Worst */}
        <MetricBlock
          label="Best Trade"
          value={formatPnl(stats?.bestTrade ?? 0)}
          valueColor="var(--green)"
        />

        <Divider />

        <MetricBlock
          label="Worst Trade"
          value={formatPnl(stats?.worstTrade ?? 0)}
          valueColor="var(--red)"
        />

        <Divider />

        <MetricBlock
          label="Total Trades"
          value={String(stats?.totalTrades ?? 0)}
          valueColor="var(--text-secondary)"
        />

        {/* Circuit breaker */}
        {info?.circuitBreakerActive && (
          <>
            <Divider />
            <div style={{ padding: '10px 16px' }}>
              <span className="badge badge-red animate-blink" style={{ fontSize: 11, padding: '4px 10px' }}>
                ⚠ CIRCUIT BREAKER ACTIVE
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricBlock({ label, value, valueColor, sub, large }: {
  label: string; value: string; valueColor?: string; sub?: string; large?: boolean;
}) {
  return (
    <div style={{ padding: '10px 16px' }}>
      <div className="label" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{
        fontSize: large ? 16 : 14,
        fontWeight: 700,
        fontFamily: large ? 'var(--font-display)' : 'var(--font-mono)',
        color: valueColor ?? 'var(--text-primary)',
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />;
}
