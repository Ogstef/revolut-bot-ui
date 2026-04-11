import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade, Position } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface Props {
  trades: Trade[] | undefined;
  positions?: Position[] | undefined;
}

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

function buildCumulative(trades: Trade[], range: Range, positions: Position[] = []) {
  const now = new Date();
  const cutoff = new Date();
  if (range === 'daily')   cutoff.setDate(now.getDate() - 1);
  if (range === 'weekly')  cutoff.setDate(now.getDate() - 7);
  if (range === 'monthly') cutoff.setMonth(now.getMonth() - 1);
  if (range === 'all')     cutoff.setFullYear(2000);

  const filtered = [...trades]
    .filter(t => new Date(t.closedAt ?? t.executedAt) >= cutoff)
    .sort((a, b) => new Date(a.closedAt ?? a.executedAt).getTime() - new Date(b.closedAt ?? b.executedAt).getTime());

  let cum = 0;
  const points: { label: string; pnl: number; live?: boolean }[] = filtered.map(t => {
    cum += t.pnl;
    const d = new Date(t.closedAt ?? t.executedAt);
    const label = range === 'daily'
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, pnl: parseFloat(cum.toFixed(2)) };
  });

  const unrealizedTotal = positions.reduce((sum, p) => sum + p.unrealisedPnl, 0);
  if (unrealizedTotal !== 0) {
    const nowLabel = range === 'daily'
      ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    points.push({ label: nowLabel, pnl: parseFloat((cum + unrealizedTotal).toFixed(2)), live: true });
  }

  return points;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pos = d.value >= 0;
  const isLive = d.payload.live;
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
        {isLive ? 'Incl. Unrealized: ' : 'Cumulative: '}{formatPnl(d.value)}
      </div>
      {isLive && <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>● Live (position open)</div>}
    </div>
  );
}

export default function StrategyPnlChart({ trades, positions }: Props) {
  const [range, setRange] = useState<Range>('weekly');
  const data = buildCumulative(trades ?? [], range, positions ?? []);
  const lastVal = data[data.length - 1]?.pnl ?? 0;
  const positive = lastVal >= 0;
  const hasLivePoint = data[data.length - 1]?.live === true;
  const unrealizedTotal = (positions ?? []).reduce((sum, p) => sum + p.unrealisedPnl, 0);
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
        {hasLivePoint && unrealizedTotal !== 0 && (
          <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
            ● incl. {formatPnl(unrealizedTotal)} unrealized
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {data.length - (hasLivePoint ? 1 : 0)} trades
        </span>
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 180 }}>
        {data.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No closed trades in range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
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
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={positive ? 'var(--green)' : 'var(--red)'}
                strokeWidth={1.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.live) return <g key={`dot-${cx}-${cy}`} />;
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="var(--amber)" stroke="var(--bg-base)" strokeWidth={1.5} />;
                }}
                activeDot={{ r: 3, fill: positive ? 'var(--green)' : 'var(--red)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
