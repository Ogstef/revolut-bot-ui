import { useState } from 'react';
import { PairProvider, usePair } from './context/PairContext';
import { useBotStatus } from './hooks/useBotStatus';
import { usePairs } from './hooks/usePairs';
import { useIntervals } from './hooks/useIntervals';
import { useStrategies } from './hooks/useStrategies';
import Header from './components/layout/Header';
import StrategyNav from './components/layout/StrategyNav';
import OverviewPage from './pages/OverviewPage';
import StrategyPage from './pages/StrategyPage';
import PortfolioPage from './pages/PortfolioPage';

function AppInner() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { selectedPair, setSelectedPair, selectedInterval, setSelectedInterval } = usePair();
  const statusQ     = useBotStatus();
  const pairsQ      = usePairs();
  const intervalsQ  = useIntervals();
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
        pairs={pairsQ.data ?? []}
        selectedPair={selectedPair}
        onPairChange={setSelectedPair}
        intervals={intervalsQ.data ?? []}
        selectedInterval={selectedInterval}
        onIntervalChange={setSelectedInterval}
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
          ✗ Cannot reach backend at localhost:8089 — is the Spring Boot server running?
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
