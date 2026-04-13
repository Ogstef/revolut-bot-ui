import type { StrategyInfo } from '../api/client';
import { usePair } from '../context/PairContext';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import StrategyCard from '../components/overview/StrategyCard';
import CumulativePnlChart from '../components/overview/CumulativePnlChart';
import SignalFrequencyChart from '../components/overview/SignalFrequencyChart';
import LeaderboardTable from '../components/overview/LeaderboardTable';
import IntervalComparisonChart from '../components/overview/IntervalComparisonChart';
import ConfigPanel from '../components/config/ConfigPanel';
import { useStrategies, useAllStrategyTrades, useAllStrategyStats, useSignalSummary } from '../hooks/useStrategies';

interface Props {
  onStrategyClick: (name: string) => void;
}

export default function OverviewPage({ onStrategyClick }: Props) {
  const { selectedPair, selectedInterval } = usePair();
  const strategiesQ = useStrategies(selectedPair, selectedInterval);

  // Derive the strategy name list — use API data when available, fallback to known list
  const strategyNames: string[] =
    strategiesQ.data && strategiesQ.data.length > 0
      ? strategiesQ.data.map(s => s.name)
      : KNOWN_STRATEGIES.map(s => s.name);

  const allTrades = useAllStrategyTrades(selectedPair, strategyNames, selectedInterval);
  const allStats  = useAllStrategyStats(selectedPair, strategyNames, selectedInterval);
  const signalsQ  = useSignalSummary(selectedPair, selectedInterval);

  const strategies: StrategyInfo[] = strategiesQ.data ?? [];
  const statsMap = new Map(allStats.map(s => [s.name, s.query.data]));

  const strategyTradesForChart = allTrades.map(s => ({
    name: s.name,
    displayName: strategies.find(st => st.name === s.name)?.displayName
      ?? KNOWN_STRATEGIES.find(k => k.name === s.name)?.displayName
      ?? s.name,
    trades: s.query.data,
  }));

  // Build leaderboard rows — only strategies we have info for
  const leaderboardRows = strategies.map(info => ({
    info,
    stats: statsMap.get(info.name),
  }));

  // Fallback cards for strategies not yet returned by API
  const cardList: StrategyInfo[] = strategies.length > 0
    ? strategies
    : KNOWN_STRATEGIES.map(s => ({
        name: s.name as any,
        displayName: s.displayName,
        openPositions: 0,
        dailyPnl: 0,
        consecutiveLosses: 0,
        circuitBreakerActive: false,
      }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Strategy cards — 4 per row for 12 strategies, 3 per row for ≤9 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cardList.length > 9 ? 4 : 3}, 1fr)`, gap: 12 }}>
        {cardList.map(info => (
          <StrategyCard
            key={info.name}
            info={info}
            winRate={statsMap.get(info.name)?.winRate}
            onClick={onStrategyClick}
          />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        <CumulativePnlChart strategyTrades={strategyTradesForChart} />
        <SignalFrequencyChart signals={signalsQ.data} isLoading={signalsQ.isLoading} />
      </div>

      {/* Leaderboard */}
      {leaderboardRows.length > 0 && (
        <LeaderboardTable rows={leaderboardRows} />
      )}

      {/* Cross-interval comparison */}
      <IntervalComparisonChart />

      {/* Config */}
      <ConfigPanel />

      <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          REVOLUT TRADING BOT — {strategyNames.length} STRATEGIES × MULTI-PAIR × MULTI-INTERVAL ({selectedInterval}) — AUTO-REFRESH
        </span>
      </div>
    </div>
  );
}
