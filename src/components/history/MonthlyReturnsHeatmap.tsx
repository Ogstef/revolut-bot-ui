import type { TradeHistoryEntry } from '../../api/client';
import { monthlyReturns } from '../../utils/analytics';
import { formatPnl } from '../../utils/format';

interface Props { trades: TradeHistoryEntry[]; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MonthlyReturnsHeatmap({ trades }: Props) {
  const map = monthlyReturns(trades);
  // Build a years × 12 grid covering the year range observed in the data.
  const years: number[] = [];
  if (map.size > 0) {
    let yMin = Infinity, yMax = -Infinity;
    for (const k of map.keys()) {
      const y = parseInt(k.split('-')[0], 10);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
    for (let y = yMin; y <= yMax; y += 1) years.push(y);
  }

  // Symmetric colour scale
  const max = Math.max(0, ...Array.from(map.values()).map(v => Math.abs(v)));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Monthly Returns</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{map.size} months</span>
      </div>

      <div style={{ padding: 14, overflowX: 'auto' }}>
        {years.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            No data
          </div>
        ) : (
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                {MONTHS.map(m => (
                  <th key={m} style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, padding: '0 2px' }}>{m}</th>
                ))}
                <th style={{ paddingLeft: 8, color: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {years.map(y => {
                let yearSum = 0;
                return (
                  <tr key={y}>
                    <td style={{ color: 'var(--text-muted)', paddingRight: 6, textAlign: 'right' }}>{y}</td>
                    {MONTHS.map((_, i) => {
                      const k = `${y}-${String(i + 1).padStart(2, '0')}`;
                      const v = map.get(k);
                      if (v != null) yearSum += v;
                      return <Cell key={k} value={v} max={max} />;
                    })}
                    <td style={{
                      paddingLeft: 8,
                      color: yearSum >= 0 ? 'var(--green)' : 'var(--red)',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {formatPnl(yearSum)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Cell({ value, max }: { value: number | undefined; max: number; }) {
  if (value == null) {
    return (
      <td style={{
        width: 50, height: 28,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 2,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 9,
      }}>·</td>
    );
  }
  const intensity = max > 0 ? Math.min(1, Math.abs(value) / max) : 0;
  const isPos = value >= 0;
  const bg = isPos
    ? `rgba(0, 230, 118, ${0.08 + intensity * 0.5})`
    : `rgba(255, 61, 90, ${0.08 + intensity * 0.5})`;
  const border = isPos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,90,0.3)';
  return (
    <td title={`${value.toFixed(2)} EUR`} style={{
      width: 50, height: 28,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 2,
      textAlign: 'center',
      color: 'var(--text-primary)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      padding: '0 4px',
    }}>
      {value >= 0 ? '+' : ''}{value.toFixed(0)}
    </td>
  );
}
