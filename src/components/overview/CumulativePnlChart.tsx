import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade } from '../../api/client';
import { strategyColor } from '../../utils/strategyMeta';
import { toCumulativePnl } from '../../utils/analytics';
import { formatPnl, formatAxisPnl } from '../../utils/format';

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

interface StrategyTrades {
  name: string;
  displayName?: string;
  trades: Trade[] | undefined;
}

function mergeTimelines(allSeries: { name: string; points: { date: number; pnl: number }[] }[]) {
  const dateSet = new Set<number>();
  for (const s of allSeries) for (const p of s.points) dateSet.add(p.date);
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

function CustomTooltip({ active, payload, label, nameMap }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '8px 12px',
      fontSize: 11,
      maxWidth: 220,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6 }}>{label}</div>
      {sorted.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 10, opacity: 0.8 }}>{nameMap[p.dataKey] ?? p.dataKey}</span>
          <span>{formatPnl(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  strategyTrades: StrategyTrades[];
  /** Optional override so callers (e.g. Cross-Interval) can colour lines by interval instead of strategy. */
  colorForKey?: (key: string) => string;
  /** Optional header label override. */
  title?: string;
}

export default function CumulativePnlChart({ strategyTrades, colorForKey, title }: Props) {
  const resolveColor = colorForKey ?? strategyColor;
  const [range, setRange] = useState<Range>('weekly');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const now = new Date();
  const cutoff = new Date();
  if (range === 'daily')   cutoff.setDate(now.getDate() - 1);
  if (range === 'weekly')  cutoff.setDate(now.getDate() - 7);
  if (range === 'monthly') cutoff.setMonth(now.getMonth() - 1);
  if (range === 'all')     cutoff.setFullYear(2000);

  const allSeries = strategyTrades
    .filter(s => !hidden.has(s.name))
    .map(s => ({ name: s.name, points: toCumulativePnl(s.trades ?? [], cutoff) }));

  const data = mergeTimelines(allSeries);
  const nameMap = Object.fromEntries(strategyTrades.map(s => [s.name, s.displayName ?? s.name]));
  const ranges: Range[] = ['daily', 'weekly', 'monthly', 'all'];

  function toggleHide(name: string) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">{title ?? 'Cumulative PnL — All Strategies'}</span>
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

      {/* Strategy toggle pills */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {strategyTrades.map(s => {
          const isHidden = hidden.has(s.name);
          const color = resolveColor(s.name);
          return (
            <button
              key={s.name}
              onClick={() => toggleHide(s.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '2px 8px',
                background: isHidden ? 'transparent' : `${color}18`,
                border: `1px solid ${isHidden ? 'var(--border)' : color}`,
                borderRadius: 2,
                color: isHidden ? 'var(--text-muted)' : color,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                cursor: 'pointer',
                opacity: isHidden ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isHidden ? 'var(--text-muted)' : color, flexShrink: 0 }} />
              {s.displayName ?? s.name}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 220 }}>
        {data.length === 0 ? (
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
                tickFormatter={v => formatAxisPnl(v)}
                width={52}
              />
              <Tooltip content={<CustomTooltip nameMap={nameMap} />} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              {allSeries.map(s => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={resolveColor(s.name)}
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
