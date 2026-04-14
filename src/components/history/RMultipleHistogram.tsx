import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TradeHistoryEntry } from '../../api/client';
import { rMultipleDistribution } from '../../utils/analytics';

interface Props { trades: TradeHistoryEntry[]; }

export default function RMultipleHistogram({ trades }: Props) {
  const data = rMultipleDistribution(trades);
  const total = data.reduce((s, b) => s + b.count, 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">R-Multiple Distribution</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {total} trades w/ stop
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 220, padding: '8px 4px 8px 0' }}>
        {total === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 14, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label"
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis allowDecimals={false}
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} width={32} />
              <ReferenceLine x="0 / 1" stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                       contentStyle={{
                         background: 'var(--bg-elevated)',
                         border: '1px solid var(--border-bright)',
                         borderRadius: 2, fontSize: 11, fontFamily: 'var(--font-mono)',
                       }}
                       labelStyle={{ color: 'var(--text-muted)', fontSize: 10 }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={36}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.sign === 'pos' ? 'var(--green)' : 'var(--red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
      No trades have a stop-loss recorded yet
    </div>
  );
}
