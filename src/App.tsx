import { useState } from 'react';
import { PairProvider, usePair } from './context/PairContext';
import { useBotStatus } from './hooks/useBotStatus';
import { usePairs } from './hooks/usePairs';
import { useIntervals } from './hooks/useIntervals';
import { useVehicles } from './hooks/useVehicles';
import { useStrategies } from './hooks/useStrategies';
import Header from './components/layout/Header';
import StrategyNav from './components/layout/StrategyNav';
import OverviewPage from './pages/OverviewPage';
import StrategyPage from './pages/StrategyPage';
import PortfolioPage from './pages/PortfolioPage';
import HistoryPage from './pages/HistoryPage';
import CurrentSignalsPage from './pages/CurrentSignalsPage';
import PositionsLivePage from './pages/PositionsLivePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import ConsensusPage from './pages/ConsensusPage';
import CrossIntervalPage from './pages/CrossIntervalPage';
import ChartsPage from './pages/ChartsPage';
import LeveragePage from './pages/LeveragePage';

function AppInner() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    selectedPair, setSelectedPair,
    selectedInterval, setSelectedInterval,
    selectedVehicle, setSelectedVehicle,
  } = usePair();
  const statusQ     = useBotStatus();
  const pairsQ      = usePairs();
  const intervalsQ  = useIntervals();
  const vehiclesQ   = useVehicles();
  const strategiesQ = useStrategies(selectedPair, selectedInterval);

  const backendDown = statusQ.isError && !statusQ.isFetching;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      <Header
        status={statusQ.data}
        isLoading={statusQ.isLoading}
        pairs={Array.isArray(pairsQ.data) ? pairsQ.data : []}
        selectedPair={selectedPair}
        onPairChange={setSelectedPair}
        intervals={Array.isArray(intervalsQ.data) ? intervalsQ.data : []}
        selectedInterval={selectedInterval}
        onIntervalChange={setSelectedInterval}
        vehicles={Array.isArray(vehiclesQ.data) ? vehiclesQ.data : []}
        selectedVehicle={selectedVehicle}
        onVehicleChange={setSelectedVehicle}
      />

      {backendDown && (
        <div style={{
          background: 'rgba(255,61,90,0.08)',
          border: '1px solid rgba(255,61,90,0.2)',
          borderLeft: '3px solid var(--red)',
          padding: '8px 20px',
          fontSize: 12,
          color: 'var(--red)',
          flexShrink: 0,
        }}>
          ✗ Cannot reach backend — is the trading bot service running?
        </div>
      )}

      {/* Sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <StrategyNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          strategies={strategiesQ.data}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {activeTab === 'overview' ? (
            <OverviewPage onStrategyClick={setActiveTab} />
          ) : activeTab === 'portfolio' ? (
            <PortfolioPage />
          ) : activeTab === 'history' ? (
            <HistoryPage />
          ) : activeTab === 'signals' ? (
            <CurrentSignalsPage onSelectStrategy={setActiveTab} />
          ) : activeTab === 'positions' ? (
            <PositionsLivePage onSelectStrategy={setActiveTab} />
          ) : activeTab === 'leaderboard' ? (
            <LeaderboardPage onSelectStrategy={setActiveTab} />
          ) : activeTab === 'activity' ? (
            <ActivityFeedPage onSelectStrategy={setActiveTab} />
          ) : activeTab === 'consensus' ? (
            <ConsensusPage onSelectStrategy={setActiveTab} />
          ) : activeTab === 'cross-interval' ? (
            <CrossIntervalPage />
          ) : activeTab === 'charts' ? (
            <ChartsPage />
          ) : activeTab === 'leverage' ? (
            <LeveragePage onSelectStrategy={setActiveTab} />
          ) : (
            <StrategyPage
              strategyName={activeTab}
              strategyInfoList={strategiesQ.data}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PairProvider>
      <AppInner />
    </PairProvider>
  );
}
