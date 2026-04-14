import type { TradeHistoryEntry } from '../../api/client';
import { hourlyDayPnl } from '../../utils/analytics';

interface Props { trades: TradeHistoryEntry[]; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HourlyPnlHeatmap({ trades }: Props) {
  const grid = hourlyDayPnl(trades);
  const max = Math.max(0, ...grid.map(c => Math.abs(c.pnl)));
  const total = grid.reduce((s, c) => s + c.count, 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">PnL by Day × Hour (entry time)</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{total} entries</span>
      </div>

      <div style={{ padding: 12, overflowX: 'auto' }}>
        {total === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>No data</div>
        ) : (
          <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontFamily: 'var(--font-mono)', fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} style={{ color: 'var(--text-muted)', fontWeight: 500, width: 18, fontSize: 9 }}>
                    {h % 3 === 0 ? h : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((d, di) => (
                <tr key={d}>
                  <td style={{ color: 'var(--text-muted)', paddingRight: 4, textAlign: 'right' }}>{d}</td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = grid[di * 24 + h];
                    return <Cell key={h} pnl={cell.pnl} count={cell.count} max={max} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Cell({ pnl, count, max }: { pnl: number; count: number; max: number; }) {
  if (count === 0) {
    return (
      <td style={{
        width: 18, height: 18,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 2,
      }} />
    );
  }
  const intensity = max > 0 ? Math.min(1, Math.abs(pnl) / max) : 0;
  const isPos = pnl >= 0;
  const bg = isPos
    ? `rgba(0, 230, 118, ${0.1 + intensity * 0.6})`
    : `rgba(255, 61, 90, ${0.1 + intensity * 0.6})`;
  return (
    <td title={`${pnl.toFixed(2)} EUR · ${count} trades`} style={{
      width: 18, height: 18,
      background: bg,
      border: `1px solid ${isPos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,90,0.3)'}`,
      borderRadius: 2,
      cursor: 'help',
    }} />
  );
}
