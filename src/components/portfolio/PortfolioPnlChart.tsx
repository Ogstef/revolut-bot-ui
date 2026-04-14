import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade } from '../../api/client';
import { formatPnl, formatAxisPnl } from '../../utils/format';

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

interface StrategyTradeResult {
  name: string;
  query: { data?: Trade[] };
}

interface Props {
  allTrades: StrategyTradeResult[];
  strategyNames: string[];
  displayName: (name: string) => string;
}

function buildPortfolioCumulative(
  allTrades: StrategyTradeResult[],
  cutoff: Date
): { label: string; pnl: number }[] {
  // Merge all trades from all strategies, filter by cutoff, sort by time
  const merged: { date: number; pnl: number }[] = allTrades.flatMap(s =>
    (s.query.data ?? [])
      .filter(t => t.exitPrice != null && t.exitPrice > 0)
      .filter(t => new Date(t.executedAt) >= cutoff)
      .map(t => ({ date: new Date(t.executedAt).getTime(), pnl: t.pnl ?? 0 }))
  );

  merged.sort((a, b) => a.date - b.date);

  let running = 0;
  return merged.map(t => ({
    label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pnl: parseFloat((running += t.pnl).toFixed(2)),
  }));
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pos = d.value >= 0;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${pos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,90,0.3)'}`,
      borderRadius: 2, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{d.payload.label}</div>
      <div style={{ fontWeight: 700, color: pos ? 'var(--green)' : 'var(--red)' }}>
        Portfolio: {formatPnl(d.value)}
      </div>
    </div>
  );
}

export default function PortfolioPnlChart({ allTrades }: Props) {
  const [range, setRange] = useState<Range>('weekly');

  const now = new Date();
  const cutoff = new Date();
  if (range === 'daily')   cutoff.setDate(now.getDate() - 1);
  if (range === 'weekly')  cutoff.setDate(now.getDate() - 7);
  if (range === 'monthly') cutoff.setMonth(now.getMonth() - 1);
  if (range === 'all')     cutoff.setFullYear(2000);

  const data = buildPortfolioCumulative(allTrades, cutoff);
  const lastVal = data[data.length - 1]?.pnl ?? 0;
  const positive = lastVal >= 0;
  const ranges: Range[] = ['daily', 'weekly', 'monthly', 'all'];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Portfolio Cumulative PnL</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {ranges.map(r => (
            <button
              key={r}
              className="btn btn-ghost"
              onClick={() => setRange(r)}
              style={{
                padding: '3px 9px', fontSize: 10,
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

      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className={`value-md ${positive ? 'positive glow-green' : 'negative glow-red'}`}>
          {formatPnl(lastVal)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {data.length} trades in range
        </span>
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 200 }}>
        {data.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No closed trades in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false} interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => formatAxisPnl(v)} width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={positive ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: positive ? 'var(--green)' : 'var(--red)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
