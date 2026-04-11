import { useState } from 'react';
import type { StrategyName } from './api/client';
import { PairProvider, usePair } from './context/PairContext';
import { useBotStatus } from './hooks/useBotStatus';
import { usePairs } from './hooks/usePairs';
import { useStrategies } from './hooks/useStrategies';
import Header from './components/layout/Header';
import StrategyNav from './components/layout/StrategyNav';
import OverviewPage from './pages/OverviewPage';
import StrategyPage from './pages/StrategyPage';

type Tab = 'overview' | StrategyName;

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { selectedPair, setSelectedPair } = usePair();
  const statusQ = useBotStatus();
  const pairsQ = usePairs();
  const strategiesQ = useStrategies(selectedPair);

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
        onPairChange={pair => {
          setSelectedPair(pair);
          // Stay on same tab — queries auto re-fetch due to pair in query key
        }}
      />
      <StrategyNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        strategies={strategiesQ.data}
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

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px',
      }}>
        {activeTab === 'overview' ? (
          <OverviewPage onStrategyClick={name => setActiveTab(name)} />
        ) : (
          <StrategyPage
            strategyName={activeTab}
            strategyInfoList={strategiesQ.data}
          />
        )}
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
