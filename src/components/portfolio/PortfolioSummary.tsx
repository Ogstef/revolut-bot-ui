import { formatPnl, formatFee } from '../../utils/format';

interface Props {
  totalDailyPnl:      number;
  totalAllTimePnl:    number;
  totalUnrealized:    number;
  openPositions:      number;
  totalTrades:        number;
  winRate:            number;
  netAllTimePnl?:     number;
  netDailyPnl?:       number;
  totalCosts?:        number;
}

export default function PortfolioSummary({
  totalDailyPnl, totalAllTimePnl, totalUnrealized,
  openPositions, totalTrades, winRate,
  netAllTimePnl, netDailyPnl, totalCosts,
}: Props) {
  const hasAllTimeFees = netAllTimePnl != null && Math.abs(totalAllTimePnl - netAllTimePnl) >= 0.005;
  const hasDailyFees   = netDailyPnl   != null && Math.abs(totalDailyPnl   - netDailyPnl)   >= 0.005;
  const allTimeNet  = netAllTimePnl ?? totalAllTimePnl;
  const dailyNet    = netDailyPnl   ?? totalDailyPnl;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* All-Time PnL */}
        <div style={{ padding: '12px 20px' }}>
          <div className="label" style={{ marginBottom: 4 }}>All-Time PnL</div>
          <span className="pnl-pair">
            <span className="net" style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: allTimeNet >= 0 ? 'var(--green)' : 'var(--red)',
              textShadow: allTimeNet >= 0 ? '0 0 12px rgba(0,230,118,0.35)' : '0 0 12px rgba(255,61,90,0.35)',
            }}>
              {formatPnl(allTimeNet)}
            </span>
            {hasAllTimeFees && <span className="gross">gross {formatPnl(totalAllTimePnl)}</span>}
          </span>
        </div>
        <Divider />
        {/* Daily PnL */}
        <div style={{ padding: '12px 20px' }}>
          <div className="label" style={{ marginBottom: 4 }}>Daily PnL</div>
          <span className="pnl-pair">
            <span className="net" style={{
              fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
              color: dailyNet >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {formatPnl(dailyNet)}
            </span>
            {hasDailyFees && <span className="gross">gross {formatPnl(totalDailyPnl)}</span>}
          </span>
        </div>
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
        {totalCosts != null && totalCosts > 0 && (
          <>
            <Divider />
            <Block
              label="Total Fees (all-time)"
              value={formatFee(totalCosts)}
              color="var(--red)"
            />
          </>
        )}
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
