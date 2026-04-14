import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { StrategyStats } from '../../pages/PortfolioPage';
import { strategyColor } from '../../utils/strategyMeta';
import { formatPnl, formatAxisPnl } from '../../utils/format';

interface Props {
  strategyStats: StrategyStats[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2, padding: '8px 12px', fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: val >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
        Total PnL: {formatPnl(val)}
      </div>
    </div>
  );
}

export default function PnlByStrategyChart({ strategyStats }: Props) {
  const data = strategyStats
    .filter(s => s.stats != null)
    .map(s => ({
      name: s.displayName.split(' ').slice(0, 2).join(' '), // abbreviate for chart
      fullName: s.displayName,
      pnl: parseFloat((s.stats!.totalPnl ?? 0).toFixed(2)),
      strategyName: s.name,
    }));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">PnL by Strategy</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>All-time</span>
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 200 }}>
        {data.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => formatAxisPnl(v)} width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]} maxBarSize={32}>
                {data.map(d => (
                  <Cell
                    key={d.strategyName}
                    fill={d.pnl >= 0 ? strategyColor(d.strategyName) : 'var(--red)'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
