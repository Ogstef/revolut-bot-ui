import { formatPnl } from '../../utils/format';

interface Props {
  totalDailyPnl:   number;
  totalAllTimePnl: number;
  totalUnrealized: number;
  openPositions:   number;
  totalTrades:     number;
  winRate:         number;
}

export default function PortfolioSummary({
  totalDailyPnl, totalAllTimePnl, totalUnrealized,
  openPositions, totalTrades, winRate,
}: Props) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Block
          label="All-Time PnL"
          value={formatPnl(totalAllTimePnl)}
          color={totalAllTimePnl >= 0 ? 'var(--green)' : 'var(--red)'}
          glow
          large
        />
        <Divider />
        <Block
          label="Daily PnL"
          value={formatPnl(totalDailyPnl)}
          color={totalDailyPnl >= 0 ? 'var(--green)' : 'var(--red)'}
        />
        <Divider />
        <Block
          label="Unrealized"
          value={formatPnl(totalUnrealized)}
          color={totalUnrealized >= 0 ? 'var(--green)' : 'var(--red)'}
          sub="open positions"
        />
        <Divider />
        <Block
          label="Open Positions"
          value={String(openPositions)}
          color="var(--amber)"
        />
        <Divider />
        <Block
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          color={winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${totalTrades} total trades`}
        />
      </div>
    </div>
  );
}

function Block({ label, value, color, glow, large, sub }: {
  label: string; value: string; color: string; glow?: boolean; large?: boolean; sub?: string;
}) {
  return (
    <div style={{ padding: '12px 20px' }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{
        fontFamily: large ? 'var(--font-display)' : 'var(--font-mono)',
        fontSize: large ? 22 : 16,
        fontWeight: 700,
        color,
        textShadow: glow ? `0 0 12px ${color}60` : undefined,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: 'var(--border)', margin: '8px 0', flexShrink: 0 }} />;
}
