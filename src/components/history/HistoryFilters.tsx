export type SideFilter   = 'ALL' | 'BUY' | 'SELL';
export type ReasonFilter = 'ALL' | 'TP_HIT' | 'SL_HIT' | 'SIGNAL_EXIT' | 'MANUAL';
export type PnlFilter    = 'ALL' | 'WINS' | 'LOSSES';

export interface HistoryFilterState {
  side:   SideFilter;
  reason: ReasonFilter;
  pnl:    PnlFilter;
  search: string;
}

export const DEFAULT_FILTERS: HistoryFilterState = {
  side: 'ALL', reason: 'ALL', pnl: 'ALL', search: '',
};

interface Props {
  value: HistoryFilterState;
  onChange: (next: HistoryFilterState) => void;
  total: number;
  shown: number;
}

export default function HistoryFilters({ value, onChange, total, shown }: Props) {
  const update = <K extends keyof HistoryFilterState>(k: K, v: HistoryFilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 2,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
    }}>
      <FilterGroup label="Side">
        <Toggle active={value.side === 'ALL'}  onClick={() => update('side', 'ALL')}  >All</Toggle>
        <Toggle active={value.side === 'BUY'}  onClick={() => update('side', 'BUY')}  color="var(--green)">Buy</Toggle>
        <Toggle active={value.side === 'SELL'} onClick={() => update('side', 'SELL')} color="var(--red)">Sell</Toggle>
      </FilterGroup>

      <FilterGroup label="Exit">
        <Toggle active={value.reason === 'ALL'}         onClick={() => update('reason', 'ALL')}>All</Toggle>
        <Toggle active={value.reason === 'TP_HIT'}      onClick={() => update('reason', 'TP_HIT')}      color="var(--green)">TP</Toggle>
        <Toggle active={value.reason === 'SL_HIT'}      onClick={() => update('reason', 'SL_HIT')}      color="var(--red)">SL</Toggle>
        <Toggle active={value.reason === 'SIGNAL_EXIT'} onClick={() => update('reason', 'SIGNAL_EXIT')} color="var(--amber)">Signal</Toggle>
        <Toggle active={value.reason === 'MANUAL'}      onClick={() => update('reason', 'MANUAL')}>Manual</Toggle>
      </FilterGroup>

      <FilterGroup label="PnL">
        <Toggle active={value.pnl === 'ALL'}    onClick={() => update('pnl', 'ALL')}>All</Toggle>
        <Toggle active={value.pnl === 'WINS'}   onClick={() => update('pnl', 'WINS')}   color="var(--green)">Wins</Toggle>
        <Toggle active={value.pnl === 'LOSSES'} onClick={() => update('pnl', 'LOSSES')} color="var(--red)">Losses</Toggle>
      </FilterGroup>

      <input
        type="text"
        value={value.search}
        onChange={e => update('search', e.target.value)}
        placeholder="Search signal reason…"
        style={{
          flex: 1,
          minWidth: 180,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 2,
          padding: '5px 8px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          outline: 'none',
        }}
      />

      <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
        {shown} / {total}
      </span>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="label" style={{ marginRight: 4 }}>{label}</span>
      <div style={{ display: 'flex', gap: 2 }}>{children}</div>
    </div>
  );
}

function Toggle({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 2,
        padding: '3px 9px',
        color: active ? (color ?? 'var(--text-primary)') : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}
