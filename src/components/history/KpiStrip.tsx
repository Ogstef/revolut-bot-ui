import type { TradeHistoryEntry } from '../../api/client';
import { formatPnl, formatFeeDrag, feeDragTier } from '../../utils/format';
import {
  equityCurve, maxDrawdown, profitFactor, expectancy,
  avgHoldingSeconds, longestStreak, winRate, formatDuration,
} from '../../utils/analytics';

interface Props { trades: TradeHistoryEntry[]; }

export default function KpiStrip({ trades }: Props) {
  const closed = trades.filter(t => t.pnl != null);
  const total  = closed.length;
  const wr     = winRate(closed);
  const netPnl = closed.reduce((acc, t) => acc + (t.netPnl ?? t.pnl ?? 0), 0);
  const totalCosts = closed.reduce((acc, t) => acc + (t.entryFee ?? 0) + (t.exitFee ?? 0) + (t.entrySlippage ?? 0) + (t.exitSlippage ?? 0), 0);
  const grossPnl = closed.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const feeDrag = grossPnl !== 0 ? (totalCosts / Math.abs(grossPnl)) * 100 : 0;
  const pf     = profitFactor(closed);
  const exp    = expectancy(closed);
  const avgHold = avgHoldingSeconds(closed);
  const equity = equityCurve(closed);
  const dd     = maxDrawdown(equity);
  const longestW = longestStreak(closed, 'W');
  const longestL = longestStreak(closed, 'L');

  return (
    <div className="card">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <Kpi label="Total Trades" value={String(total)} color="var(--text-secondary)" />
        <Divider />
        <Kpi
          label="Win Rate"
          value={`${wr.toFixed(1)}%`}
          color={wr >= 50 ? 'var(--green)' : 'var(--red)'}
        />
        <Divider />
        <Kpi
          label="Net PnL"
          value={formatPnl(netPnl)}
          color={netPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          large
          glow={netPnl >= 0}
        />
        <Divider />
        <Kpi
          label="Profit Factor"
          value={pf === Infinity ? '∞' : pf.toFixed(2)}
          color={pf >= 1 ? 'var(--green)' : 'var(--red)'}
        />
        <Divider />
        <Kpi
          label="Expectancy"
          value={`${formatPnl(exp)} / trade`}
          color={exp >= 0 ? 'var(--green)' : 'var(--red)'}
        />
        <Divider />
        <Kpi label="Avg Hold" value={formatDuration(avgHold)} color="var(--blue)" />
        <Divider />
        <Kpi
          label="Max Drawdown"
          value={formatPnl(dd)}
          color="var(--red)"
        />
        <Divider />
        <Kpi
          label="Longest Streak"
          value={`${longestW}W / ${longestL}L`}
          color="var(--text-secondary)"
        />
        {totalCosts > 0 && (
          <>
            <Divider />
            <div style={{ padding: '10px 16px' }}>
              <div className="label" style={{ marginBottom: 3 }}>Fee Drag</div>
              <span className={`fee-chip tier-${feeDragTier(feeDrag)}`}>
                {formatFeeDrag(feeDrag)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, color, large, glow }: {
  label: string; value: string; color: string; large?: boolean; glow?: boolean;
}) {
  return (
    <div style={{ padding: '10px 16px' }}>
      <div className="label" style={{ marginBottom: 3 }}>{label}</div>
      <div
        className={glow ? 'glow-green' : ''}
        style={{
          fontSize: large ? 16 : 13,
          fontWeight: 700,
          fontFamily: large ? 'var(--font-display)' : 'var(--font-mono)',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />;
}
