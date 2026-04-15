import type { TripleStats } from '../../api/client';
import { formatPnl } from '../../utils/format';

export interface TripleHeatmapProps {
  data: TripleStats[];
  pairs: string[];
  intervals: string[];
  onCellClick?: (row: TripleStats) => void;
}

// Inlined symmetric PnL colour helper. Duplicated (intentionally) from
// MonthlyReturnsHeatmap to avoid touching that file — see page spec.
function pnlHeatStyle(value: number | null, absMax: number): {
  background: string;
  border: string;
  color: string;
} {
  if (value == null) {
    return {
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      color: 'var(--text-muted)',
    };
  }
  const intensity = absMax > 0 ? Math.min(1, Math.abs(value) / absMax) : 0;
  const isPos = value >= 0;
  const bg = isPos
    ? `rgba(0, 230, 118, ${0.08 + intensity * 0.5})`
    : `rgba(255, 61, 90, ${0.08 + intensity * 0.5})`;
  const border = isPos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,90,0.3)';
  return { background: bg, border: `1px solid ${border}`, color: 'var(--text-primary)' };
}

export default function TripleHeatmap({ data, pairs, intervals, onCellClick }: TripleHeatmapProps) {
  const byKey = new Map<string, TripleStats>();
  data.forEach(s => byKey.set(`${s.pair}|${s.interval}`, s));

  const absMax = Math.max(
    0,
    ...data
      .filter(s => s.totalTrades > 0)
      .map(s => Math.abs(s.totalPnl)),
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ width: 70, color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textAlign: 'left', padding: '0 4px' }}></th>
            {intervals.map(iv => (
              <th
                key={iv}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '0 4px',
                  textAlign: 'center',
                }}
              >
                {iv}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pairs.map(pair => (
            <tr key={pair}>
              <td style={{
                color: 'var(--text-muted)',
                paddingRight: 6,
                textAlign: 'right',
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}>
                {pair}
              </td>
              {intervals.map(iv => {
                const row = byKey.get(`${pair}|${iv}`);
                const hasTrades = row != null && row.totalTrades > 0;
                const style = pnlHeatStyle(hasTrades ? row!.totalPnl : null, absMax);
                const content = hasTrades ? formatPnl(row!.totalPnl) : '—';
                const clickable = row != null && onCellClick != null;
                return (
                  <td
                    key={iv}
                    onClick={clickable ? () => onCellClick!(row!) : undefined}
                    title={row ? `${row.pair} · ${row.interval} · ${row.totalTrades} trades` : 'no data'}
                    style={{
                      width: 78,
                      height: 28,
                      background: style.background,
                      border: style.border,
                      borderRadius: 2,
                      textAlign: 'center',
                      color: style.color,
                      fontWeight: hasTrades ? 600 : 400,
                      padding: '0 4px',
                      whiteSpace: 'nowrap',
                      cursor: clickable ? 'pointer' : 'default',
                    }}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
