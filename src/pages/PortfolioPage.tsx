import { useMemo } from 'react';
import { usePair } from '../context/PairContext';
import { KNOWN_STRATEGIES, strategyColor } from '../utils/strategyMeta';
import { useStrategies, useAllStrategyTrades, useAllStrategyStats, useAllStrategyPositions } from '../hooks/useStrategies';
import type { Trade, Position, StrategyInfo, Stats } from '../api/client';
import { formatPnl } from '../utils/format';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import PortfolioPnlChart from '../components/portfolio/PortfolioPnlChart';
import PnlByStrategyChart from '../components/portfolio/PnlByStrategyChart';
import AllPositionsTable from '../components/portfolio/AllPositionsTable';
import AllTradesTable from '../components/portfolio/AllTradesTable';

export interface StrategyPositions { name: string; displayName: string; positions: Position[] }
export interface StrategyTrades    { name: string; displayName: string; trades: Trade[] }
export interface StrategyStats     { name: string; displayName: string; info?: StrategyInfo; stats?: Stats }

export default function PortfolioPage() {
  const { selectedPair } = usePair();

  const strategiesQ = useStrategies(selectedPair);
  const strategyNames: string[] =
    strategiesQ.data?.length
      ? strategiesQ.data.map(s => s.name)
      : KNOWN_STRATEGIES.map(s => s.name);

  const allTrades    = useAllStrategyTrades(selectedPair, strategyNames);
  const allPositions = useAllStrategyPositions(selectedPair, strategyNames);
  const allStats     = useAllStrategyStats(selectedPair, strategyNames);

  const strategies: StrategyInfo[] = strategiesQ.data ?? [];

  function displayName(name: string) {
    return strategies.find(s => s.name === name)?.displayName
      ?? KNOWN_STRATEGIES.find(k => k.name === name)?.displayName
      ?? name;
  }

  // Flatten all positions with strategy label
  const flatPositions: (Position & { strategyName: string; strategyDisplayName: string })[] = useMemo(() =>
    allPositions.flatMap(s =>
      (s.query.data ?? []).map(p => ({
        ...p,
        strategyName: s.name,
        strategyDisplayName: displayName(s.name),
      }))
    ), [allPositions]);

  // Flatten all closed trades with strategy label
  const flatTrades: (Trade & { strategyDisplayName: string })[] = useMemo(() =>
    allTrades.flatMap(s =>
      (s.query.data ?? [])
        .filter(t => t.exitPrice != null && t.exitPrice > 0)
        .map(t => ({ ...t, strategyDisplayName: displayName(s.name) }))
    ).sort((a, b) =>
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    ), [allTrades]);

  // Stats per strategy for bar chart
  const strategyStats: StrategyStats[] = strategyNames.map((name, i) => ({
    name,
    displayName: displayName(name),
    info: strategies.find(s => s.name === name),
    stats: allStats[i]?.query.data,
  }));

  // Portfolio-level aggregates
  const totalUnrealized = flatPositions.reduce((s, p) => s + p.unrealisedPnl, 0);
  const totalDailyPnl   = strategies.reduce((s, st) => s + (st.dailyPnl ?? 0), 0);
  const totalAllTimePnl = strategyStats.reduce((s, st) => s + (st.stats?.totalPnl ?? 0), 0);
  const totalTrades     = strategyStats.reduce((s, st) => s + (st.stats?.totalTrades ?? 0), 0);
  const totalWins       = strategyStats.reduce((s, st) => s + (st.stats?.winningTrades ?? 0), 0);
  const combinedWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  const isLoading = allTrades.some(s => s.query.isLoading) || allPositions.some(s => s.query.isLoading);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          Portfolio
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>
          {selectedPair.replace('-', '/')} · All Strategies
        </span>
      </div>

      {/* Summary bar */}
      <PortfolioSummary
        totalDailyPnl={totalDailyPnl}
        totalAllTimePnl={totalAllTimePnl}
        totalUnrealized={totalUnrealized}
        openPositions={flatPositions.length}
        totalTrades={totalTrades}
        winRate={combinedWinRate}
      />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        <PortfolioPnlChart allTrades={allTrades} strategyNames={strategyNames} displayName={displayName} />
        <PnlByStrategyChart strategyStats={strategyStats} />
      </div>

      {/* All open positions */}
      <AllPositionsTable positions={flatPositions} isLoading={isLoading} />

      {/* All closed trades */}
      <AllTradesTable trades={flatTrades} isLoading={isLoading} />

      <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          COMBINED VIEW — {strategyNames.length} STRATEGIES — {selectedPair}
        </span>
      </div>
    </div>
  );
}
