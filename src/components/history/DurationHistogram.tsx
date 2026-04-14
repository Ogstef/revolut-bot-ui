import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { TradeHistoryEntry } from '../../api/client';
import { durationBuckets } from '../../utils/analytics';

interface Props { trades: TradeHistoryEntry[]; }

export default function DurationHistogram({ trades }: Props) {
  const data = durationBuckets(trades);
  const total = data.reduce((s, b) => s + b.count, 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Holding Duration</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {total} trades w/ duration
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
                     axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false}
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} width={32} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                       contentStyle={{
                         background: 'var(--bg-elevated)',
                         border: '1px solid var(--border-bright)',
                         borderRadius: 2, fontSize: 11, fontFamily: 'var(--font-mono)',
                       }}
                       labelStyle={{ color: 'var(--text-muted)', fontSize: 10 }}
                       itemStyle={{ color: 'var(--blue)' }} />
              <Bar dataKey="count" fill="var(--blue)" radius={[2, 2, 0, 0]} maxBarSize={32} />
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
      No data
    </div>
  );
}
