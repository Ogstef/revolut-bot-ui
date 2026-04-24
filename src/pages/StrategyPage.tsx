import { useMemo } from 'react';
import type { StrategyInfo } from '../api/client';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import { usePair } from '../context/PairContext';
import StrategyHeader from '../components/strategy/StrategyHeader';
import OpenPositions from '../components/strategy/OpenPositions';
import TradesTable from '../components/strategy/TradesTable';
import PnlBreakdown from '../components/strategy/PnlBreakdown';
import StrategyPnlChart from '../components/strategy/StrategyPnlChart';
import SignalHistory from '../components/strategy/SignalHistory';
import { useStrategyDetail } from '../hooks/useStrategyDetail';
import type { StrategyName } from '../api/client';

interface Props {
  strategyName: string;
  strategyInfoList?: StrategyInfo[];
}

export default function StrategyPage({ strategyName, strategyInfoList }: Props) {
  const { selectedPair, selectedInterval, selectedVehicle } = usePair();
  const { positions, trades, stats, pnl, signals } = useStrategyDetail(strategyName as StrategyName, selectedPair, selectedInterval);

  const info = strategyInfoList?.find(s => s.name === strategyName);
  const displayName =
    info?.displayName ??
    KNOWN_STRATEGIES.find(s => s.name === strategyName)?.displayName ??
    strategyName;

  // Detect leveraged rows in the fetched data even when vehicle filter isn't active
  const leveragedPositionCount = useMemo(() => {
    return (positions.data ?? []).filter(p => p.vehicle && p.vehicle !== 'SPOT').length;
  }, [positions.data]);

  const leveragedTradeCount = useMemo(() => {
    return (trades.data ?? []).filter(t => t.vehicle && t.vehicle !== 'SPOT').length;
  }, [trades.data]);

  const mixedVehicleCount = leveragedPositionCount + leveragedTradeCount;
  const showMixedBanner = selectedVehicle === 'SPOT' && mixedVehicleCount > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {displayName}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>
          {selectedPair.replace('-', '/')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
          {selectedInterval}
        </span>
        {info?.circuitBreakerActive && (
          <span className="badge badge-red animate-blink">⚠ Circuit Breaker Active</span>
        )}
      </div>

      {/* Mixed-vehicle info banner */}
      {showMixedBanner && (
        <div style={{
          background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--amber) 35%, transparent)',
          borderRadius: 4,
          padding: '6px 12px',
          fontSize: 11,
          color: 'var(--amber)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontWeight: 700 }}>Mixed vehicles</span>
          <span style={{ color: 'var(--text-secondary)' }}>—</span>
          <span>{mixedVehicleCount} leveraged row{mixedVehicleCount !== 1 ? 's' : ''} present (rows are marked with amber badges). To view only a specific vehicle, use the Veh dropdown or switch to the Leverage tab.</span>
        </div>
      )}

      {/* Header stats bar */}
      <StrategyHeader info={info} stats={stats.data} pnl={pnl.data} />

      {/* Row 1: Open positions + PnL chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <OpenPositions positions={positions.data} isLoading={positions.isLoading} />
        <StrategyPnlChart trades={trades.data} positions={positions.data} />
      </div>

      {/* Row 2: Trades table + PnL breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
        <TradesTable trades={trades.data} isLoading={trades.isLoading} />
        <PnlBreakdown pnl={pnl.data} isLoading={pnl.isLoading} dailyOverride={info?.dailyPnl} />
      </div>

      {/* Row 3: Signal history — strategy-aware columns */}
      <SignalHistory
        signals={signals.data}
        isLoading={signals.isLoading}
        strategyName={strategyName}
      />
    </div>
  );
}
