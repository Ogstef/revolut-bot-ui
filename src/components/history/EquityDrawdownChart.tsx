import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TradeHistoryEntry } from '../../api/client';
import { equityCurve, drawdownSeries } from '../../utils/analytics';
import { formatPnl, formatAxisPnl } from '../../utils/format';

interface Props { trades: TradeHistoryEntry[]; }

export default function EquityDrawdownChart({ trades }: Props) {
  const equity = equityCurve(trades);
  const dd = drawdownSeries(equity);

  const merged = equity.map((p, i) => ({
    label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    equity: parseFloat(p.equity.toFixed(2)),
    drawdown: parseFloat((dd[i]?.drawdown ?? 0).toFixed(2)),
  }));

  const last = merged[merged.length - 1];
  const positive = (last?.equity ?? 0) >= 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Equity Curve & Drawdown</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{merged.length} closed trades</span>
      </div>

      <div style={{ flex: 1, minHeight: 280, padding: '8px 4px 8px 0' }}>
        {merged.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={merged} margin={{ top: 8, right: 18, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="ddGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%"  stopColor="var(--red)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--red)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="equity"
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} tickFormatter={formatAxisPnl} width={52} />
              <YAxis yAxisId="dd" orientation="right"
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} tickFormatter={formatAxisPnl} width={52} />
              <Tooltip content={<HistoryTooltip />} />
              <ReferenceLine yAxisId="equity" y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Area yAxisId="dd" type="monotone" dataKey="drawdown"
                    stroke="var(--red)" strokeWidth={1} fill="url(#ddGradient)" />
              <Line yAxisId="equity" type="monotone" dataKey="equity"
                    stroke={positive ? 'var(--green)' : 'var(--red)'} strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function HistoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const eq = payload.find((p: any) => p.dataKey === 'equity')?.value ?? 0;
  const dd = payload.find((p: any) => p.dataKey === 'drawdown')?.value ?? 0;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '8px 12px',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>{label}</div>
      <div style={{ color: eq >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
        Equity: {formatPnl(eq)}
      </div>
      <div style={{ color: 'var(--red)', fontSize: 11 }}>
        Drawdown: {formatPnl(dd)}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 6 }}>∅</div>
        No closed trades for this selection
      </div>
    </div>
  );
}
