import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import PositionsTable from './components/PositionsTable';
import TradesTable from './components/TradesTable';
import PnlChart from './components/PnlChart';
import ConfigPanel from './components/ConfigPanel';

export default function App() {
  const statusQ = useQuery({
    queryKey: ['status'],
    queryFn: api.getStatus,
    refetchInterval: 10_000,
    retry: false,
  });

  const positionsQ = useQuery({
    queryKey: ['positions'],
    queryFn: api.getPositions,
    refetchInterval: 15_000,
    retry: false,
  });

  const tradesQ = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.getTrades(100),
    refetchInterval: 30_000,
    retry: false,
  });

  const statsQ = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 60_000,
    retry: false,
  });

  const pnlQ = useQuery({
    queryKey: ['pnl'],
    queryFn: api.getPnl,
    refetchInterval: 60_000,
    retry: false,
  });

  const backendDown = statusQ.isError && !statusQ.isFetching;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      <Header status={statusQ.data} isLoading={statusQ.isLoading} />

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

      {/* Main scrollable area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Row 1: Chart + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
          <PnlChart trades={tradesQ.data} />
          <StatsPanel stats={statsQ.data} pnl={pnlQ.data} />
        </div>

        {/* Row 2: Open Positions */}
        <div style={{ minHeight: 200 }}>
          <PositionsTable positions={positionsQ.data} isLoading={positionsQ.isLoading} />
        </div>

        {/* Row 3: Recent Trades */}
        <div style={{ minHeight: 240 }}>
          <TradesTable trades={tradesQ.data} isLoading={tradesQ.isLoading} />
        </div>

        {/* Row 4: Config */}
        <ConfigPanel />

        {/* Footer */}
        <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            REVOLUT TRADING BOT — LOCAL DASHBOARD — DATA REFRESHES AUTOMATICALLY
          </span>
        </div>
      </div>
    </div>
  );
}
