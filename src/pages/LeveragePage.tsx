import { useMemo } from 'react';
import type { Position } from '../api/client';
import { useLivePositions } from '../hooks/useLivePositions';
import { useVehicles } from '../hooks/useVehicles';
import { usePair } from '../context/PairContext';
import { formatPnl, formatPrice } from '../utils/format';

interface Props {
  onSelectStrategy: (name: string) => void;
}

export default function LeveragePage({ onSelectStrategy }: Props) {
  const positionsQ = useLivePositions();
  const vehiclesQ  = useVehicles();
  const { selectedVehicle } = usePair();

  const rows = positionsQ.data ?? [];
  // All non-SPOT positions from the full live list
  const allLeveraged = useMemo(
    () => rows.filter(p => p.vehicle && p.vehicle !== 'SPOT'),
    [rows],
  );
  // When a specific vehicle is selected in the header, filter to that vehicle;
  // when SPOT is selected (meaning "spot view"), show all leveraged as a useful default.
  const leveraged = useMemo(
    () => selectedVehicle !== 'SPOT'
      ? allLeveraged.filter(p => p.vehicle === selectedVehicle)
      : allLeveraged,
    [allLeveraged, selectedVehicle],
  );
  const activeVehicles = (vehiclesQ.data ?? []).filter(v => v.active && v.name !== 'SPOT');

  const totals = useMemo(() => {
    const byVehicle: Record<string, {
      vehicle: string;
      leverage: number;
      count: number;
      totalCollateral: number;
      totalNotional: number;
      totalUnrealised: number;
      totalFunding: number;
      liquidatedCount: number;
    }> = {};
    for (const p of leveraged) {
      const key = p.vehicle!;
      if (!byVehicle[key]) {
        byVehicle[key] = {
          vehicle: key,
          leverage: p.leverage ?? 0,
          count: 0,
          totalCollateral: 0,
          totalNotional: 0,
          totalUnrealised: 0,
          totalFunding: 0,
          liquidatedCount: 0,
        };
      }
      byVehicle[key].count += 1;
      byVehicle[key].totalCollateral += p.collateral ?? 0;
      byVehicle[key].totalNotional   += p.notional ?? 0;
      byVehicle[key].totalUnrealised += p.unrealisedPnl;
      byVehicle[key].totalFunding    += p.fundingFeesAccrued ?? 0;
    }
    return Object.values(byVehicle).sort((a, b) => a.leverage - b.leverage);
  }, [leveraged]);

  if (positionsQ.isLoading) {
    return <Centered>Loading leveraged positions…</Centered>;
  }
  if (positionsQ.isError) {
    return <Centered error>Failed to load — is the backend reachable?</Centered>;
  }

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>⚖ Leverage</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Live leveraged virtual portfolios. Each (pair, strategy, ratio) starts with €1,000 collateral.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {leveraged.length} open leveraged · {activeVehicles.length} active ratio{activeVehicles.length === 1 ? '' : 's'} · refreshes every 15s
        </div>
      </div>

      {activeVehicles.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>⊘</div>
            Leverage is not enabled — check <code>trading.leverage.enabled</code> in <code>application.yml</code>.
          </div>
        </div>
      )}

      {/* Per-vehicle summary cards */}
      {totals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totals.length}, 1fr)`, gap: 10 }}>
          {totals.map(t => (
            <VehicleCard key={t.vehicle} data={t} />
          ))}
        </div>
      )}

      {/* Open leveraged positions */}
      {leveraged.length === 0 ? (
        activeVehicles.length > 0 && (
          <div className="card">
            <div className="card-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>⊘</div>
              No open leveraged positions right now — waiting for signals to fire on<br/>
              BTC-EUR × [1h, 4h, 1d] × [LEV_3X, LEV_5X, LEV_10X].
            </div>
          </div>
        )
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Strategy</th>
                  <th>Pair</th>
                  <th>Interval</th>
                  <th>Side</th>
                  <th style={{ textAlign: 'right' }}>Entry</th>
                  <th style={{ textAlign: 'right' }}>Current</th>
                  <th style={{ textAlign: 'right' }}>Collateral</th>
                  <th style={{ textAlign: 'right' }}>Notional</th>
                  <th style={{ textAlign: 'right' }}>Liquidation</th>
                  <th style={{ textAlign: 'right' }}>Margin %</th>
                  <th style={{ textAlign: 'right' }}>Funding</th>
                  <th style={{ textAlign: 'right' }}>Unreal. PnL</th>
                </tr>
              </thead>
              <tbody>
                {leveraged.map(p => (
                  <LeverageRow
                    key={`${p.vehicle}-${p.pair}-${p.interval ?? 'na'}-${p.strategyName ?? 'unknown'}-${p.id}`}
                    pos={p}
                    onClick={() => p.strategyName && onSelectStrategy(p.strategyName)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleCard({ data }: {
  data: {
    vehicle: string; leverage: number; count: number;
    totalCollateral: number; totalNotional: number;
    totalUnrealised: number; totalFunding: number;
  };
}) {
  const label = data.vehicle.replace('LEV_', '').replace('X', 'x');
  const pnlPos = data.totalUnrealised >= 0;
  return (
    <div className="card" style={{
      padding: 14,
      borderLeft: `3px solid var(--amber)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--amber)' }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {data.count} open
        </div>
      </div>
      <Stat label="Unrealised"  value={<span style={{ color: pnlPos ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{formatPnl(data.totalUnrealised)}</span>} />
      <Stat label="Collateral"  value={`€${data.totalCollateral.toFixed(2)}`} />
      <Stat label="Notional"    value={`€${data.totalNotional.toFixed(2)}`} />
      <Stat label="Funding"     value={`€${data.totalFunding.toFixed(4)}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

function LeverageRow({ pos, onClick }: { pos: Position; onClick: () => void }) {
  const pnlPos = pos.unrealisedPnl >= 0;
  const marginRatio = pos.currentMarginRatio ?? null;
  const marginColor = marginRatio == null ? 'var(--text-muted)'
    : marginRatio > 0.6 ? 'var(--green)'
    : marginRatio > 0.3 ? 'var(--amber)'
    : 'var(--red)';
  const rowTint = marginRatio != null && marginRatio < 0.3
    ? 'color-mix(in srgb, var(--red) 8%, transparent)'
    : marginRatio != null && marginRatio < 0.6
    ? 'color-mix(in srgb, var(--amber) 5%, transparent)'
    : undefined;
  return (
    <tr
      onClick={onClick}
      style={{ cursor: pos.strategyName ? 'pointer' : 'default', background: rowTint }}
      title={pos.strategyName ? `Open ${pos.displayName ?? pos.strategyName} detail tab` : undefined}
    >
      <td>
        <span className="badge" style={{
          background: 'color-mix(in srgb, var(--amber) 18%, transparent)',
          color: 'var(--amber)',
          fontWeight: 700,
        }}>
          {pos.vehicle!.replace('LEV_', '').replace('X', 'x')}
        </span>
      </td>
      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
        {pos.displayName ?? pos.strategyName ?? '—'}
      </td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>{pos.pair}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{pos.interval ?? '—'}</td>
      <td>
        <span className={`badge ${pos.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{pos.side}</span>
      </td>
      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatPrice(pos.entryPrice)}</td>
      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(pos.currentPrice)}</td>
      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        €{(pos.collateral ?? 0).toFixed(2)}
      </td>
      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        €{(pos.notional ?? 0).toFixed(2)}
      </td>
      <td style={{ textAlign: 'right', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        {pos.liquidationPrice != null ? `€${pos.liquidationPrice.toFixed(2)}` : '—'}
      </td>
      <td style={{ textAlign: 'right', color: marginColor, fontWeight: 700 }}>
        {marginRatio != null ? `${(marginRatio * 100).toFixed(1)}%` : '—'}
      </td>
      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
        €{(pos.fundingFeesAccrued ?? 0).toFixed(4)}
      </td>
      <td style={{ textAlign: 'right', fontWeight: 700, color: pnlPos ? 'var(--green)' : 'var(--red)' }}
          className={pnlPos ? 'positive' : 'negative'}>
        {formatPnl(pos.unrealisedPnl)}
      </td>
    </tr>
  );
}

function Centered({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', fontSize: 12,
      color: error ? 'var(--red)' : 'var(--text-muted)',
    }}>
      {children}
    </div>
  );
}
