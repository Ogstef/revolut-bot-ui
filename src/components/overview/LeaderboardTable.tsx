import { useState } from 'react';
import type { StrategyInfo, Stats } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface StrategyRow {
  info: StrategyInfo;
  stats: Stats | undefined;
}

type SortKey = 'totalTrades' | 'winRate' | 'totalPnl' | 'expectancy' | 'dailyPnl';

interface Props {
  rows: StrategyRow[];
}

function readValue(row: StrategyRow, key: SortKey): number {
  if (key === 'dailyPnl') return row.info.dailyPnl ?? 0;
  return (row.stats?.[key] as number | undefined) ?? -Infinity;
}

export default function LeaderboardTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('totalPnl');
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const av = readValue(a, sortKey);
    const bv = readValue(b, sortKey);
    return sortDesc ? bv - av : av - bv;
  });

  // Best value per column for highlighting
  const best: Record<SortKey, number> = {
    totalTrades: Math.max(...rows.map(r => r.stats?.totalTrades ?? 0)),
    winRate:     Math.max(...rows.map(r => r.stats?.winRate     ?? 0)),
    totalPnl:    Math.max(...rows.map(r => r.stats?.totalPnl    ?? -Infinity)),
    expectancy:  Math.max(...rows.map(r => r.stats?.expectancy  ?? -Infinity)),
    dailyPnl:    Math.max(...rows.map(r => r.info.dailyPnl ?? -Infinity)),
  };

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: 'totalTrades', label: 'Trades'      },
    { key: 'winRate',     label: 'Win Rate'    },
    { key: 'dailyPnl',    label: 'Daily PnL'   },
    { key: 'totalPnl',    label: 'Total PnL'   },
    { key: 'expectancy',  label: 'Expectancy'  },
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header">
        <span className="label">Leaderboard</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click column to sort</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 14 }}>Strategy</th>
              {cols.map(c => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{ cursor: 'pointer', userSelect: 'none', color: sortKey === c.key ? 'var(--text-primary)' : undefined }}
                >
                  {c.label} {sortKey === c.key ? (sortDesc ? '▼' : '▲') : ''}
                </th>
              ))}
              <th>Circuit Brk</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const s = r.stats;
              const daily = r.info.dailyPnl ?? 0;
              const isBestPnl    = (s?.totalPnl    ?? -Infinity) === best.totalPnl    && best.totalPnl    > 0;
              const isBestWr     = (s?.winRate     ?? 0)         === best.winRate     && best.winRate     > 0;
              const isBestExp    = (s?.expectancy  ?? -Infinity) === best.expectancy  && best.expectancy  > 0;
              const isBestTrades = (s?.totalTrades ?? 0)         === best.totalTrades && best.totalTrades > 0;
              const isBestDaily  = daily                         === best.dailyPnl   && best.dailyPnl    > 0;

              return (
                <tr key={r.info.name} style={{
                  background: i === 0 ? 'rgba(0,230,118,0.03)' : undefined,
                }}>
                  <td style={{ paddingLeft: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 16 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{r.info.displayName}</span>
                      {r.info.circuitBreakerActive && (
                        <span className="badge badge-red" style={{ fontSize: 9 }}>CB</span>
                      )}
                    </div>
                  </td>
                  <ValueCell value={s?.totalTrades ?? null} isBest={isBestTrades} format={v => String(v)} />
                  <ValueCell
                    value={s?.winRate ?? null}
                    isBest={isBestWr}
                    format={v => `${v.toFixed(1)}%`}
                    colorize={v => v >= 50 ? 'var(--green)' : 'var(--red)'}
                  />
                  <ValueCell
                    value={daily}
                    isBest={isBestDaily}
                    format={v => formatPnl(v)}
                    colorize={v => v >= 0 ? 'var(--green)' : 'var(--red)'}
                  />
                  <ValueCell
                    value={s?.totalPnl ?? null}
                    isBest={isBestPnl}
                    format={v => formatPnl(v)}
                    colorize={v => v >= 0 ? 'var(--green)' : 'var(--red)'}
                  />
                  <ValueCell
                    value={s?.expectancy ?? null}
                    isBest={isBestExp}
                    format={v => formatPnl(v)}
                    colorize={v => v >= 0 ? 'var(--green)' : 'var(--red)'}
                    suffix=" / trade"
                  />
                  <td>
                    {r.info.circuitBreakerActive
                      ? <span className="badge badge-red animate-blink">ON</span>
                      : <span className="badge badge-green">OFF</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValueCell({ value, isBest, format, colorize, suffix }: {
  value: number | null;
  isBest: boolean;
  format: (v: number) => string;
  colorize?: (v: number) => string;
  suffix?: string;
}) {
  if (value == null) return <td style={{ color: 'var(--text-muted)' }}>—</td>;
  const color = colorize ? colorize(value) : 'var(--text-primary)';
  return (
    <td>
      <span style={{
        fontWeight: isBest ? 700 : 400,
        color,
        background: isBest ? `${color}18` : undefined,
        padding: isBest ? '1px 6px' : undefined,
        borderRadius: isBest ? 2 : undefined,
        border: isBest ? `1px solid ${color}40` : undefined,
      }}>
        {format(value)}{suffix ?? ''}
      </span>
    </td>
  );
}
