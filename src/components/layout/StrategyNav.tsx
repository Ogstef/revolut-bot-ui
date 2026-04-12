import type { StrategyInfo } from '../../api/client';
import { KNOWN_STRATEGIES } from '../../utils/strategyMeta';

type Tab = string; // 'overview' | strategy name

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  strategies?: StrategyInfo[];
}

export default function StrategyNav({ activeTab, onTabChange, strategies }: Props) {
  // Use live strategy list from API; fall back to known list while loading
  const tabs: { name: string; displayName: string }[] =
    strategies && strategies.length > 0
      ? strategies.map(s => ({ name: s.name, displayName: s.displayName }))
      : KNOWN_STRATEGIES;

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
      scrollbarWidth: 'none',
    }}>
      <NavTab
        label="Overview"
        active={activeTab === 'overview'}
        onClick={() => onTabChange('overview')}
      />

      <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 6px', flexShrink: 0 }} />

      {tabs.map(s => {
        const info = strategyMap.get(s.name);
        return (
          <NavTab
            key={s.name}
            label={s.displayName}
            active={activeTab === s.name}
            onClick={() => onTabChange(s.name)}
            circuitBreaker={info?.circuitBreakerActive ?? false}
            pnl={info?.dailyPnl}
          />
        );
      })}
    </nav>
  );
}

function NavTab({
  label, active, onClick, circuitBreaker, pnl,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  circuitBreaker?: boolean;
  pnl?: number;
}) {
  const pnlColor = pnl == null ? undefined : pnl >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        marginBottom: -1,
        flexShrink: 0,
      }}
    >
      {label}
      {circuitBreaker && (
        <span className="badge badge-red animate-blink" style={{ fontSize: 8, padding: '1px 4px' }}>CB</span>
      )}
      {pnl != null && (
        <span style={{ fontSize: 10, color: pnlColor, fontWeight: 600 }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}€
        </span>
      )}
    </button>
  );
}
