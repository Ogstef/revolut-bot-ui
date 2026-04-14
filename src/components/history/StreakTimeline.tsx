import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TradeHistoryEntry } from '../../api/client';
import { streaks } from '../../utils/analytics';

interface Props { trades: TradeHistoryEntry[]; }

export default function StreakTimeline({ trades }: Props) {
  const data = streaks(trades).map((s, i) => ({
    idx: i + 1,
    label: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    signed: s.type === 'W' ? s.length : -s.length,
    type: s.type,
    length: s.length,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
  }));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Win / Loss Streaks (chronological)</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{data.length} streaks</span>
      </div>

      <div style={{ flex: 1, minHeight: 220, padding: '8px 4px 8px 0' }}>
        {data.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 14, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label"
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false}
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                     axisLine={false} tickLine={false} width={32} />
              <ReferenceLine y={0} stroke="var(--border-bright)" />
              <Tooltip content={<StreakTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="signed" radius={[2, 2, 2, 2]} maxBarSize={18}>
                {data.map(d => (
                  <Cell key={d.idx} fill={d.type === 'W' ? 'var(--green)' : 'var(--red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StreakTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '6px 10px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: d.type === 'W' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
        {d.type === 'W' ? 'Winning' : 'Losing'} streak: {d.length}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        {new Date(d.startedAt).toLocaleDateString()} → {new Date(d.endedAt).toLocaleDateString()}
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
