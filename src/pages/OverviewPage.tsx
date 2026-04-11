import type { StrategyName, StrategyInfo } from '../api/client';
import { STRATEGIES } from '../api/client';
import { usePair } from '../context/PairContext';
import StrategyCard from '../components/overview/StrategyCard';
import CumulativePnlChart from '../components/overview/CumulativePnlChart';
import SignalFrequencyChart from '../components/overview/SignalFrequencyChart';
import ConfigPanel from '../components/config/ConfigPanel';
import { useStrategies, useAllStrategyTrades, useAllStrategyStats, useSignalSummary } from '../hooks/useStrategies';

interface Props {
  onStrategyClick: (name: StrategyName) => void;
}

export default function OverviewPage({ onStrategyClick }: Props) {
  const { selectedPair } = usePair();

  const strategiesQ = useStrategies(selectedPair);
  const allTrades = useAllStrategyTrades(selectedPair);
  const allStats = useAllStrategyStats(selectedPair);
  const signalsQ = useSignalSummary(selectedPair);

  const strategies: StrategyInfo[] = strategiesQ.data ?? [];
  const winRateMap = new Map(allStats.map(s => [s.name, s.query.data?.winRate]));

  const strategyTradesForChart = allTrades.map(s => ({
    name: s.name,
    trades: s.query.data,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Strategy cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STRATEGIES.map(s => {
          const info = strategies.find(st => st.name === s.name) ?? {
            name: s.name,
            displayName: s.displayName,
            openPositions: 0,
            dailyPnl: 0,
            consecutiveLosses: 0,
            circuitBreakerActive: false,
          };
          return (
            <StrategyCard
              key={s.name}
              info={info}
              winRate={winRateMap.get(s.name)}
              onClick={onStrategyClick}
            />
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <CumulativePnlChart strategyTrades={strategyTradesForChart} />
        <SignalFrequencyChart signals={signalsQ.data} isLoading={signalsQ.isLoading} />
      </div>

      {/* Config */}
      <ConfigPanel />

      <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          REVOLUT TRADING BOT — 4 STRATEGIES × MULTI-PAIR — DATA REFRESHES AUTOMATICALLY
        </span>
      </div>
    </div>
  );
}
