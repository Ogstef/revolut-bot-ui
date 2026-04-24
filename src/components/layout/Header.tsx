import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyStop, resume } from '../../api/status';
import type { BotStatus, PairInfo, IntervalInfo, TradingVehicle, VehicleInfo } from '../../api/client';
import { formatPnl, formatTime } from '../../utils/format';
import FearGreedWidget from '../FearGreedWidget';

interface Props {
  status: BotStatus | undefined;
  isLoading: boolean;
  pairs: PairInfo[];
  selectedPair: string;
  onPairChange: (pair: string) => void;
  intervals: IntervalInfo[];
  selectedInterval: string;
  onIntervalChange: (interval: string) => void;
  vehicles: VehicleInfo[];
  selectedVehicle: TradingVehicle;
  onVehicleChange: (vehicle: TradingVehicle) => void;
}

export default function Header({
  status, isLoading, pairs, selectedPair, onPairChange,
  intervals, selectedInterval, onIntervalChange,
  vehicles, selectedVehicle, onVehicleChange,
}: Props) {
  const qc = useQueryClient();

  const stopMut = useMutation({
    mutationFn: emergencyStop,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status'] }),
  });
  const resumeMut = useMutation({
    mutationFn: resume,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status'] }),
  });

  const running = status?.running ?? false;
  const cb = status?.circuitBreakerOn ?? false;

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      flexShrink: 0,
      gap: 16,
    }}>
      {/* Left: Brand + pair selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26,
            background: 'var(--green-dim)',
            border: '1px solid rgba(0,230,118,0.3)',
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--green)',
          }}>Ξ</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            REVOLUT<span style={{ color: 'var(--green)' }}>BOT</span>
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Pair dropdown */}
        <PairDropdown
          pairs={pairs}
          selected={selectedPair}
          onChange={onPairChange}
        />

        {/* Interval dropdown */}
        <IntervalDropdown
          intervals={intervals}
          selected={selectedInterval}
          onChange={onIntervalChange}
        />

        {/* Vehicle dropdown */}
        <VehicleDropdown
          vehicles={vehicles}
          selected={selectedVehicle}
          onChange={onVehicleChange}
        />

        <span className={`badge ${status?.mode === 'LIVE' ? 'badge-red' : 'badge-amber'}`}>
          {status?.mode ?? '—'}
        </span>
      </div>

      {/* Center: metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Metric label="Daily PnL" value={
          isLoading ? '…' :
          <span className={`${(status?.dailyPnl ?? 0) >= 0 ? 'positive glow-green' : 'negative glow-red'}`}>
            {formatPnl(status?.dailyPnl ?? 0)}
          </span>
        } />
        <Metric label="Open Positions" value={
          <span style={{ color: 'var(--blue)' }}>{status?.openPositions ?? 0}</span>
        } />
        <Metric label="Consec. Losses" value={
          <span className={(status?.consecutiveLosses ?? 0) > 2 ? 'negative' : 'neutral'}>
            {status?.consecutiveLosses ?? 0}
          </span>
        } />
        <Metric label="Circuit Breaker" value={
          cb
            ? <span className="badge badge-red animate-blink">TRIPPED</span>
            : <span className="badge badge-green">OK</span>
        } />
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <FearGreedWidget />
        {status?.reportedAt && (
          <Metric label="Updated" value={
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {formatTime(status.reportedAt)}
            </span>
          } />
        )}
      </div>

      {/* Right: status dot + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusDot running={running} />
        {running ? (
          <button
            className="btn btn-danger"
            onClick={() => stopMut.mutate()}
            disabled={stopMut.isPending}
          >
            {stopMut.isPending ? 'Stopping…' : '⏹ Emergency Stop'}
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={() => resumeMut.mutate()}
            disabled={resumeMut.isPending}
          >
            {resumeMut.isPending ? 'Resuming…' : '▶ Resume'}
          </button>
        )}
      </div>
    </header>
  );
}

function PairDropdown({ pairs, selected, onChange }: {
  pairs: PairInfo[];
  selected: string;
  onChange: (pair: string) => void;
}) {
  const displayLabel = (p: string) => p.replace('-', '/');

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 8, fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
        Pair
      </div>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 2,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          padding: '4px 28px 4px 38px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {pairs.length === 0 && (
          <option value={selected}>{displayLabel(selected)}</option>
        )}
        {pairs.map(p => (
          <option key={p.pair} value={p.pair}>{displayLabel(p.pair)}</option>
        ))}
      </select>
      {/* Chevron */}
      <div style={{
        position: 'absolute', right: 8,
        fontSize: 9, color: 'var(--text-muted)', pointerEvents: 'none',
      }}>▼</div>
    </div>
  );
}

function IntervalDropdown({ intervals, selected, onChange }: {
  intervals: IntervalInfo[];
  selected: string;
  onChange: (interval: string) => void;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 8, fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
        Int
      </div>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 2,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          padding: '4px 28px 4px 32px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {intervals.length === 0 && (
          <option value={selected}>{selected}</option>
        )}
        {intervals.map(i => (
          <option key={i.label} value={i.label}>{i.label}</option>
        ))}
      </select>
      <div style={{
        position: 'absolute', right: 8,
        fontSize: 9, color: 'var(--text-muted)', pointerEvents: 'none',
      }}>▼</div>
    </div>
  );
}

function VehicleDropdown({ vehicles, selected, onChange }: {
  vehicles: VehicleInfo[];
  selected: TradingVehicle;
  onChange: (vehicle: TradingVehicle) => void;
}) {
  const label = (v: TradingVehicle) => v === 'SPOT' ? 'SPOT' : v.replace('LEV_', '').replace('X', 'x');
  const isLeveraged = selected !== 'SPOT';
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 8, fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
        Veh
      </div>
      <select
        value={selected}
        onChange={e => onChange(e.target.value as TradingVehicle)}
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${isLeveraged ? 'var(--amber)' : 'var(--border-bright)'}`,
          borderRadius: 2,
          color: isLeveraged ? 'var(--amber)' : 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          padding: '4px 28px 4px 34px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {vehicles.length === 0 && (
          <option value={selected}>{label(selected)}</option>
        )}
        {vehicles.map(v => (
          <option key={v.name} value={v.name} disabled={!v.active}>
            {label(v.name)}{!v.active ? ' (off)' : ''}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute', right: 8,
        fontSize: 9, color: 'var(--text-muted)', pointerEvents: 'none',
      }}>▼</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span className="label">{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatusDot({ running }: { running: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: running ? 'var(--green)' : 'var(--red)',
        animation: running ? 'pulse-dot-green 2s ease-in-out infinite' : 'pulse-dot-red 2s ease-in-out infinite',
      }} />
      <span style={{
        fontSize: 11, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: running ? 'var(--green)' : 'var(--red)',
      }}>
        {running ? 'Running' : 'Stopped'}
      </span>
    </div>
  );
}
