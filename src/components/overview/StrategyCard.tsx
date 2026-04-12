import type { StrategyInfo } from '../../api/client';
import { formatPnl } from '../../utils/format';

interface Props {
  info: StrategyInfo;
  winRate?: number;
  onClick: (name: string) => void;
}

export default function StrategyCard({ info, winRate, onClick }: Props) {
  const pnlPos = info.dailyPnl >= 0;

  return (
    <div
      className="card"
      onClick={() => onClick(info.name)}
      style={{
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        borderColor: info.circuitBreakerActive ? 'rgba(255,61,90,0.4)' : undefined,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = info.circuitBreakerActive ? 'rgba(255,61,90,0.4)' : 'var(--border)')}
    >
      {/* Header */}
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          {info.displayName}
        </span>
        {info.circuitBreakerActive
          ? <span className="badge badge-red animate-blink">⚠ CB</span>
          : <span className="badge badge-green">● OK</span>
        }
      </div>

      {/* Daily PnL */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div className="label" style={{ marginBottom: 3 }}>Daily PnL</div>
        <div style={{
          fontSize: 20,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: pnlPos ? 'var(--green)' : 'var(--red)',
          textShadow: pnlPos ? '0 0 10px rgba(0,230,118,0.4)' : '0 0 10px rgba(255,61,90,0.4)',
        }}>
          {formatPnl(info.dailyPnl)}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <MiniStat label="Open Pos" value={String(info.openPositions)} color="var(--blue)" />
        <MiniStat
          label="Win Rate"
          value={winRate != null ? `${winRate.toFixed(1)}%` : '—'}
          color={winRate != null ? (winRate >= 50 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)'}
          border="left"
        />
        <MiniStat
          label="Consec. Loss"
          value={String(info.consecutiveLosses)}
          color={info.consecutiveLosses > 2 ? 'var(--red)' : 'var(--text-secondary)'}
          border="top"
        />
        <MiniStat
          label="Circuit Brk"
          value={info.circuitBreakerActive ? 'ON' : 'OFF'}
          color={info.circuitBreakerActive ? 'var(--red)' : 'var(--text-muted)'}
          border="top-left"
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, border }: {
  label: string; value: string; color: string; border?: string;
}) {
  return (
    <div style={{
      padding: '8px 14px',
      borderTop: border?.includes('top') ? '1px solid var(--border)' : undefined,
      borderLeft: border?.includes('left') ? '1px solid var(--border)' : undefined,
    }}>
      <div className="label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
