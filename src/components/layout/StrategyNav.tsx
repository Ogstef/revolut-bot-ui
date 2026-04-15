import type { StrategyInfo } from '../../api/client';
import { KNOWN_STRATEGIES } from '../../utils/strategyMeta';
import { formatPnl } from '../../utils/format';

type Tab = string;

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  strategies?: StrategyInfo[];
}

export default function StrategyNav({ activeTab, onTabChange, strategies }: Props) {
  const tabs: { name: string; displayName: string }[] =
    strategies && strategies.length > 0
      ? strategies.map(s => ({ name: s.name, displayName: s.displayName }))
      : KNOWN_STRATEGIES;

  const strategyMap = new Map(strategies?.map(s => [s.name, s]));

  return (
    <aside style={{
      width: 180,
      minWidth: 180,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Fixed nav items */}
      <SideItem label="Overview"  active={activeTab === 'overview'}   onClick={() => onTabChange('overview')} />
      <SideItem label="Portfolio" active={activeTab === 'portfolio'}  onClick={() => onTabChange('portfolio')} accent />
      <SideItem label="History"   active={activeTab === 'history'}    onClick={() => onTabChange('history')}  accent />
      <SideItem label="Signals"   active={activeTab === 'signals'}    onClick={() => onTabChange('signals')}  accent />

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />

      <div style={{
        padding: '4px 12px 6px',
        fontSize: 9,
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
      }}>
        Strategies ({tabs.length})
      </div>

      {/* Strategy list */}
      {tabs.map(s => {
        const info = strategyMap.get(s.name);
        return (
          <SideItem
            key={s.name}
            label={s.displayName}
            active={activeTab === s.name}
            onClick={() => onTabChange(s.name)}
            circuitBreaker={info?.circuitBreakerActive ?? false}
            pnl={info?.dailyPnl}
          />
        );
      })}
    </aside>
  );
}

function SideItem({
  label, active, onClick, circuitBreaker, pnl, accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  circuitBreaker?: boolean;
  pnl?: number;
  accent?: boolean;
}) {
  const pnlColor = pnl == null ? undefined : pnl >= 0 ? 'var(--green)' : 'var(--red)';
  const activeColor = accent ? 'var(--blue)' : 'var(--green)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 14px',
        background: active ? 'rgba(0,230,118,0.06)' : 'transparent',
        border: 'none',
        borderLeft: active ? `2px solid ${activeColor}` : '2px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.12s',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 4 }}>
        {circuitBreaker && (
          <span className="badge badge-red animate-blink" style={{ fontSize: 8, padding: '1px 3px' }}>CB</span>
        )}
        {pnl != null && (
          <span style={{ fontSize: 10, color: pnlColor, fontWeight: 600 }}>
            {formatPnl(pnl)}
          </span>
        )}
      </span>
    </button>
  );
}
