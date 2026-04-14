import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { usePair } from '../../context/PairContext';
import { useIntervals } from '../../hooks/useIntervals';
import { useStrategies } from '../../hooks/useStrategies';
import { fetchStats } from '../../api/strategies';
import { KNOWN_STRATEGIES } from '../../utils/strategyMeta';
import { formatPnl, formatAxisPnl } from '../../utils/format';
import type { StrategyName, Stats } from '../../api/client';

/**
 * Cross-interval comparison chart — shows the same strategies' total PnL
 * side-by-side across all configured intervals for the selected pair.
 * Lets you quickly see whether a strategy performs better on 15m vs 1h, etc.
 */
export default function IntervalComparisonChart() {
  const { selectedPair } = usePair();
  const intervalsQ = useIntervals();
  const strategiesQ = useStrategies(selectedPair);
  const [metric, setMetric] = useState<'totalPnl' | 'winRate' | 'expectancy'>('totalPnl');

  const intervals = intervalsQ.data ?? [];
  const strategyNames: string[] = strategiesQ.data?.length
    ? strategiesQ.data.map(s => s.name)
    : KNOWN_STRATEGIES.map(s => s.name);

  // Fetch stats for EVERY (strategy, interval) combo — N_strategies x N_intervals queries
  const allStatQueries = useQueries({
    queries: strategyNames.flatMap(name =>
      intervals.map(iv => ({
        queryKey: ['stats', name, selectedPair, iv.label],
        queryFn: () => fetchStats(name as StrategyName, selectedPair, iv.label),
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
        retry: false,
      }))
    ),
  });

  // Build chart data: one row per strategy, columns = interval labels
  const chartData = useMemo(() => {
    return strategyNames.map((name, sIdx) => {
      const row: Record<string, string | number> = { strategy: shortName(name) };
      intervals.forEach((iv, iIdx) => {
        const q = allStatQueries[sIdx * intervals.length + iIdx];
        const s = q?.data as Stats | undefined;
        row[iv.label] = s ? readMetric(s, metric) : 0;
      });
      return row;
    });
  }, [strategyNames, intervals, allStatQueries, metric]);

  if (intervals.length === 0) {
    return (
      <div className="card" style={{ padding: 14 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading intervals…</div>
      </div>
    );
  }

  const colors = ['#00e676', '#4fc3f7', '#ffb800', '#ce93d8', '#ff7043'];

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            Cross-Interval Comparison
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedPair.replace('-', '/')} — same strategy across all intervals
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['totalPnl', 'winRate', 'expectancy'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`btn ${metric === m ? 'btn-primary' : ''}`}
              style={{ fontSize: 11, padding: '2px 8px' }}
            >
              {metricLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="strategy"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            angle={-30}
            textAnchor="end"
            height={50}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickFormatter={v => metric === 'winRate' ? `${v}%` : formatAxisPnl(v)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              fontSize: 11,
            }}
            formatter={(value: unknown) => {
              const n = Number(value ?? 0);
              return metric === 'winRate' ? `${n.toFixed(1)}%` : formatPnl(n);
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {intervals.map((iv, i) => (
            <Bar key={iv.label} dataKey={iv.label} fill={colors[i % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function readMetric(s: Stats, m: 'totalPnl' | 'winRate' | 'expectancy'): number {
  if (m === 'totalPnl')   return Number(s.totalPnl ?? 0);
  if (m === 'winRate')    return Number(s.winRate ?? 0);
  return Number(s.expectancy ?? 0);
}

function metricLabel(m: 'totalPnl' | 'winRate' | 'expectancy'): string {
  if (m === 'totalPnl')   return 'Total PnL';
  if (m === 'winRate')    return 'Win Rate';
  return 'Expectancy';
}

// Shorten strategy names for x-axis labels
function shortName(name: string): string {
  const map: Record<string, string> = {
    EMA_CROSSOVER: 'EMA',
    RSI_MOMENTUM: 'RSI',
    STOCH_RSI: 'StochRSI',
    TRIPLE_EMA: '3-EMA',
    PARABOLIC_SAR: 'SAR',
    ADX_DI: 'ADX',
    BOLLINGER: 'Boll',
    ICHIMOKU: 'Ichi',
    DONCHIAN: 'Donch',
  };
  return map[name] ?? name;
}
