import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePair } from '../context/PairContext';
import { useCandles } from '../hooks/useCandles';
import { useStrategies } from '../hooks/useStrategies';
import { fetchHistory } from '../api/history';
import { fetchPositions } from '../api/strategies';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import CandlestickChart from '../components/charts/CandlestickChart';
import type { StrategyName } from '../api/client';

const LIMITS = [100, 200, 500, 1000] as const;

export default function ChartsPage() {
  const { selectedPair, selectedInterval } = usePair();
  const [limit, setLimit]             = useState<number>(500);
  const [strategy, setStrategy]       = useState<StrategyName | null>(null);
  const [showEntries, setShowEntries] = useState(true);
  const [showExits, setShowExits]     = useState(true);

  const candlesQ    = useCandles(limit);
  const strategiesQ = useStrategies(selectedPair, selectedInterval);

  const strategyNames: StrategyName[] = useMemo(() => {
    if (strategiesQ.data && strategiesQ.data.length > 0) {
      return strategiesQ.data.map(s => s.name);
    }
    return KNOWN_STRATEGIES.map(s => s.name as StrategyName);
  }, [strategiesQ.data]);

  // 30-day window for trade markers
  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 19);
  }, []);

  const tradesQ = useQuery({
    queryKey: ['chart-trades', strategy, selectedPair, selectedInterval, fromDate],
    queryFn:  () => fetchHistory(strategy!, selectedPair, selectedInterval, fromDate),
    enabled:  !!strategy,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  // Fetch open positions for the selected strategy — used for TP/SL price lines
  const positionsQ = useQuery({
    queryKey: ['chart-positions', strategy, selectedPair, selectedInterval],
    queryFn:  () => fetchPositions(strategy!, selectedPair, selectedInterval),
    enabled:  !!strategy,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const candles   = candlesQ.data   ?? [];
  const trades    = tradesQ.data    ?? [];
  const positions = positionsQ.data ?? [];

  // counts for the summary strip
  const entryCount = trades.length;
  const exitCount  = trades.filter(t => t.closedAt).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Top controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {selectedPair} · {selectedInterval}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CANDLES</span>
          {LIMITS.map(l => (
            <button
              key={l}
              onClick={() => setLimit(l)}
              style={{
                padding: '3px 8px',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                border: '1px solid',
                borderColor: limit === l ? 'var(--green)' : 'var(--border)',
                borderRadius: 4,
                background: limit === l ? 'rgba(0,230,118,0.1)' : 'transparent',
                color: limit === l ? 'var(--green)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Strategy selector ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginRight: 4 }}>
          Trades
        </span>
        <button
          onClick={() => setStrategy(null)}
          style={chipStyle(strategy === null)}
        >
          None
        </button>
        {strategyNames.map(name => (
          <button
            key={name}
            onClick={() => setStrategy(name)}
            style={chipStyle(strategy === name)}
          >
            {name.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── Toggle row ── */}
      {strategy && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ToggleChip label="Entries" active={showEntries} color="var(--green)" onClick={() => setShowEntries(v => !v)} />
          <ToggleChip label="Exits"   active={showExits}   color="var(--amber)" onClick={() => setShowExits(v => !v)} />
          <ToggleChip label="Positions" active={positions.length > 0} color="var(--blue)" onClick={() => {}} />
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {entryCount} entries · {exitCount} exits · {positions.length} open
          </span>
          {(tradesQ.isFetching || positionsQ.isFetching) && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>loading…</span>
          )}
        </div>
      )}

      {/* ── Chart ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {candlesQ.isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 2, background: 'var(--bg-surface)',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
          }}>
            Loading candles…
          </div>
        )}
        {candlesQ.isError && (
          <div style={{
            padding: 32, textAlign: 'center', fontSize: 12,
            color: 'var(--red)', fontFamily: 'var(--font-mono)',
          }}>
            Failed to load candles — is the backend running?
          </div>
        )}
        {candles.length > 0 && (
          <CandlestickChart
            candles={candles}
            trades={strategy ? trades : []}
            positions={strategy ? positions : []}
            showEntries={showEntries}
            showExits={showExits}
            height={540}
          />
        )}
      </div>

      {/* ── Legend ── */}
      {strategy && (trades.length > 0 || positions.length > 0) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <LegendItem color="#00e676" label="BUY entry (↑)" />
          <LegendItem color="#ff3d5a" label="SELL entry (↓)" />
          <LegendItem color="#00e676" shape="circle" label="TP exit" />
          <LegendItem color="#ff3d5a" shape="circle" label="SL exit" />
          <LegendItem color="#ffa726" shape="circle" label="Signal exit" />
          {positions.length > 0 && (
            <>
              <LegendItem color="#00e676" shape="line" label="Entry price" />
              <LegendItem color="#00e676" shape="dashed" label="Take profit" />
              <LegendItem color="#ff3d5a" shape="dashed" label="Stop loss" />
            </>
          )}
        </div>
      )}

      {/* ── Open positions summary ── */}
      {strategy && positions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Open positions
          </span>
          {positions.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: 12,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                padding: '6px 10px',
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                borderLeft: `2px solid ${p.side === 'BUY' ? 'var(--green)' : 'var(--red)'}`,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: p.side === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {p.side}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>Entry: <span style={{ color: 'var(--text)' }}>€{p.entryPrice.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Now: <span style={{ color: 'var(--text)' }}>€{p.currentPrice.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              <span style={{ color: '#00e676' }}>TP: €{p.takeProfit.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span style={{ color: '#ff3d5a' }}>SL: €{p.stopLoss.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span style={{ color: p.unrealisedPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {p.unrealisedPnl >= 0 ? '+' : ''}{p.unrealisedPnl.toFixed(2)} EUR ({p.unrealisedPnlPct >= 0 ? '+' : ''}{p.unrealisedPnlPct.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 8px',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    border: '1px solid',
    borderColor: active ? 'var(--blue)' : 'var(--border)',
    borderRadius: 4,
    background: active ? 'rgba(33,150,243,0.12)' : 'transparent',
    color: active ? 'var(--blue)' : 'var(--text-muted)',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap' as const,
  };
}

function ToggleChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        borderRadius: 4,
        background: active ? `${color}18` : 'transparent',
        color: active ? color : 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? color : 'var(--border)', flexShrink: 0 }} />
      {label}
    </button>
  );
}

function LegendItem({ color, label, shape }: { color: string; label: string; shape?: 'circle' | 'arrow' | 'line' | 'dashed' }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {shape === 'circle' ? (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      ) : shape === 'line' ? (
        <span style={{ width: 16, height: 1, background: color, flexShrink: 0 }} />
      ) : shape === 'dashed' ? (
        <span style={{ width: 16, height: 1, background: `repeating-linear-gradient(to right, ${color} 0px, ${color} 3px, transparent 3px, transparent 6px)`, flexShrink: 0 }} />
      ) : (
        <span style={{ fontSize: 10, color }}>▲</span>
      )}
      {label}
    </span>
  );
}
