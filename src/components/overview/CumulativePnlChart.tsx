import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { Trade, StrategyName } from '../../api/client';
import { STRATEGIES } from '../../api/client';
import { formatPnl } from '../../utils/format';

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

const STRATEGY_COLORS: Record<StrategyName, string> = {
  EMA_CROSSOVER: '#00e676',
  MACD:          '#4fc3f7',
  BOLLINGER:     '#ffb800',
  RSI_MOMENTUM:  '#ff7043',
};

interface StrategyTrades {
  name: StrategyName;
  trades: Trade[] | undefined;
}

function toCumulativePnl(trades: Trade[], cutoff: Date): { date: number; pnl: number }[] {
  const filtered = trades
    .filter(t => new Date(t.closedAt ?? t.executedAt) >= cutoff)
    .sort((a, b) => new Date(a.closedAt ?? a.executedAt).getTime() - new Date(b.closedAt ?? b.executedAt).getTime());
  let running = 0;
  return filtered.map(t => ({
    date: new Date(t.closedAt ?? t.executedAt).getTime(),
    pnl: parseFloat((running += t.pnl ?? 0).toFixed(2)),
  }));
}

function mergeTimelines(allSeries: { name: StrategyName; points: { date: number; pnl: number }[] }[]) {
  const dateSet = new Set<number>();
  for (const s of allSeries) {
    for (const p of s.points) dateSet.add(p.date);
  }

  const sortedDates = Array.from(dateSet).sort((a, b) => a - b);
  const lastPnl: Record<string, number> = {};

  return sortedDates.map(date => {
    const row: Record<string, number | string> = {
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    for (const s of allSeries) {
      const point = s.points.find(p => p.date === date);
      if (point != null) lastPnl[s.name] = point.pnl;
      row[s.name] = lastPnl[s.name] ?? 0;
    }
    return row;
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '8px 12px',
      fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {STRATEGIES.find(s => s.name === p.dataKey)?.displayName}: {formatPnl(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function CumulativePnlChart({ strategyTrades }: { strategyTrades: StrategyTrades[] }) {
  const [range, setRange] = useState<Range>('weekly');

  const now = new Date();
  const cutoff = new Date();
  if (range === 'daily')   cutoff.setDate(now.getDate() - 1);
  if (range === 'weekly')  cutoff.setDate(now.getDate() - 7);
  if (range === 'monthly') cutoff.setMonth(now.getMonth() - 1);
  if (range === 'all')     cutoff.setFullYear(2000);

  const allSeries = strategyTrades.map(s => ({
    name: s.name,
    points: toCumulativePnl(s.trades ?? [], cutoff),
  }));

  const data = mergeTimelines(allSeries);
  const ranges: Range[] = ['daily', 'weekly', 'monthly', 'all'];
  const hasData = data.length > 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Cumulative PnL — All Strategies</span>
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

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 220 }}>
        {!hasData ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No trades in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `€${v}`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', paddingTop: 8 }}
                formatter={(value) => STRATEGIES.find(s => s.name === value)?.displayName ?? value}
              />
              {STRATEGIES.map(s => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={STRATEGY_COLORS[s.name]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
