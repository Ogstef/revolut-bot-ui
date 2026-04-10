import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade } from '../api/client';
import { formatPnl } from '../utils/format';

interface Props { trades: Trade[] | undefined; }

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

function buildCumulative(trades: Trade[], range: Range) {
  if (!trades.length) return [];

  const now = new Date();
  const cutoff = new Date();
  if (range === 'daily')   cutoff.setDate(now.getDate() - 1);
  if (range === 'weekly')  cutoff.setDate(now.getDate() - 7);
  if (range === 'monthly') cutoff.setMonth(now.getMonth() - 1);
  if (range === 'all')     cutoff.setFullYear(2000);

  const filtered = trades
    .filter(t => new Date(t.executedAt) >= cutoff)
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

  let cum = 0;
  return filtered.map(t => {
    cum += t.pnl;
    const d = new Date(t.executedAt);
    const label = range === 'daily'
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, pnl: parseFloat(cum.toFixed(2)), trade: t };
  });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pos = d.value >= 0;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${pos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,90,0.3)'}`,
      borderRadius: 2,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{d.payload.label}</div>
      <div style={{ fontWeight: 700, color: pos ? 'var(--green)' : 'var(--red)' }}>
        Cumulative: {formatPnl(d.value)}
      </div>
    </div>
  );
}

export default function PnlChart({ trades }: Props) {
  const [range, setRange] = useState<Range>('weekly');
  const data = buildCumulative(trades ?? [], range);
  const lastVal = data[data.length - 1]?.pnl ?? 0;
  const positive = lastVal >= 0;

  const ranges: Range[] = ['daily', 'weekly', 'monthly', 'all'];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Cumulative PnL</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {ranges.map(r => (
            <button
              key={r}
              className="btn btn-ghost"
              onClick={() => setRange(r)}
              style={{
                padding: '3px 9px',
                fontSize: 10,
                background: r === range ? 'var(--bg-elevated)' : 'transparent',
                borderColor: r === range ? 'var(--border-bright)' : 'transparent',
                color: r === range ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <span className={`value-md ${positive ? 'positive glow-green' : 'negative glow-red'}`}>
          {formatPnl(lastVal)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
          {data.length} trades in range
        </span>
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 180 }}>
        {data.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No data for this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={positive ? '#00e676' : '#ff3d5a'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={positive ? '#00e676' : '#ff3d5a'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `€${v}`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={positive ? 'var(--green)' : 'var(--red)'}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: positive ? 'var(--green)' : 'var(--red)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
