import type { StrategyName, StrategyInfo } from '../../api/client';
import { STRATEGIES } from '../../api/client';

type Tab = 'overview' | StrategyName;

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  strategies?: StrategyInfo[];
}

export default function StrategyNav({ activeTab, onTabChange, strategies }: Props) {
  const strategyMap = new Map(strategies?.map(s => [s.name, s]));

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
      overflowX: 'auto',
    }}>
      <NavTab
        label="Overview"
        active={activeTab === 'overview'}
        onClick={() => onTabChange('overview')}
      />

      <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 8px', flexShrink: 0 }} />

      {STRATEGIES.map(s => {
        const info = strategyMap.get(s.name);
        const hasCircuitBreaker = info?.circuitBreakerActive ?? false;
        return (
          <NavTab
            key={s.name}
            label={s.displayName}
            active={activeTab === s.name}
            onClick={() => onTabChange(s.name)}
            badge={hasCircuitBreaker ? 'CB' : undefined}
            badgeCls={hasCircuitBreaker ? 'badge-red' : undefined}
            pnl={info?.dailyPnl}
          />
        );
      })}
    </nav>
  );
}

function NavTab({
  label, active, onClick, badge, badgeCls, pnl,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  badgeCls?: string;
  pnl?: number;
}) {
  const pnlColor = pnl == null ? undefined : pnl >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        marginBottom: -1,
        flexShrink: 0,
      }}
    >
      {label}
      {badge && <span className={`badge ${badgeCls}`} style={{ fontSize: 9, padding: '1px 5px' }}>{badge}</span>}
      {pnl != null && (
        <span style={{ fontSize: 10, color: pnlColor, fontWeight: 600 }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}€
        </span>
      )}
    </button>
  );
}
