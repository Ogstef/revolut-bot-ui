import { useMemo, useState } from 'react';
import {
  ComposedChart, Line, Area, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import type {
  BacktestRequest, BacktestRunDetail, BacktestRunSummary,
  BacktestStats, EquityPoint, SimulatedTrade, StrategyName,
  WalkForwardResult,
} from '../api/client';
import { useBacktest, useWalkForward } from '../hooks/useBacktest';
import { useBacktestRuns } from '../hooks/useBacktestRuns';
import { useBacktestRun } from '../hooks/useBacktestRun';
import { usePairs } from '../hooks/usePairs';
import { useIntervals } from '../hooks/useIntervals';
import { KNOWN_STRATEGIES } from '../utils/strategyMeta';
import { formatPnl, formatPct, formatPrice } from '../utils/format';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ResultMode =
  | { kind: 'fresh'; detail: BacktestRunDetail }
  | { kind: 'loaded'; id: string }
  | { kind: 'walkforward'; result: WalkForwardResult }
  | null;

const TODAY = new Date().toISOString().slice(0, 10);
const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

export default function BacktestPage() {
  const [result, setResult] = useState<ResultMode>(null);
  const runsQ = useBacktestRuns();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 280px',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <BacktestForm onResult={setResult} />
        <ResultPanel result={result} />
      </div>

      <RunsHistorySidebar
        runs={runsQ.data ?? []}
        onSelect={(id) => setResult({ kind: 'loaded', id })}
        loading={runsQ.isLoading}
      />
    </div>
  );
}

// ─── Form ──────────────────────────────────────────────────────────────────────

function BacktestForm({ onResult }: { onResult: (r: ResultMode) => void }) {
  const pairsQ = usePairs();
  const intervalsQ = useIntervals();
  const backtest = useBacktest();
  const walkForward = useWalkForward();

  const [pair, setPair] = useState('BTC-EUR');
  const [strategy, setStrategy] = useState<StrategyName>('RSI_MOMENTUM');
  const [interval, setInterval] = useState('15m');
  const [startDate, setStartDate] = useState(NINETY_DAYS_AGO);
  const [endDate, setEndDate] = useState(TODAY);
  const [startingBalance, setStartingBalance] = useState<string>('');
  const [tpPct, setTpPct] = useState<string>('');
  const [slPct, setSlPct] = useState<string>('');
  const [feeRate, setFeeRate] = useState<string>('');
  const [slipRate, setSlipRate] = useState<string>('');
  const [emaShort, setEmaShort] = useState<string>('');
  const [emaLong, setEmaLong] = useState<string>('');
  const [rsiPeriod, setRsiPeriod] = useState<string>('');
  const [advanced, setAdvanced] = useState(false);
  const [walkForwardOn, setWalkForwardOn] = useState(false);
  const [windows, setWindows] = useState<string>('3');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  const isPending = backtest.isPending || walkForward.isPending;
  const error = (backtest.error as any)?.message ?? (walkForward.error as any)?.message ?? null;

  function buildRequest(): BacktestRequest {
    const overrides: Record<string, number> = {};
    if (tpPct)    overrides.takeProfitPct = parseFloat(tpPct);
    if (slPct)    overrides.stopLossPct = parseFloat(slPct);
    if (feeRate)  overrides.feeRate = parseFloat(feeRate);
    if (slipRate) overrides.slippageRate = parseFloat(slipRate);
    if (strategy === 'EMA_CROSSOVER') {
      if (emaShort)  overrides.emaShortPeriod = parseInt(emaShort, 10);
      if (emaLong)   overrides.emaLongPeriod = parseInt(emaLong, 10);
      if (rsiPeriod) overrides.rsiPeriod = parseInt(rsiPeriod, 10);
    }
    return {
      pair, strategy, interval,
      startDate: `${startDate}T00:00:00`,
      endDate: `${endDate}T23:59:59`,
      startingBalance: startingBalance ? parseFloat(startingBalance) : undefined,
      paramOverrides: Object.keys(overrides).length ? overrides : undefined,
      label: label || undefined,
      notes: notes || undefined,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const req = buildRequest();
    if (walkForwardOn) {
      const r = await walkForward.mutateAsync({ req, windows: parseInt(windows, 10) || 3 });
      onResult({ kind: 'walkforward', result: r });
    } else {
      const detail = await backtest.mutateAsync(req);
      onResult({ kind: 'fresh', detail });
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">New Backtest</span>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="Pair">
          <select className="input" value={pair} onChange={e => setPair(e.target.value)}>
            {(pairsQ.data ?? []).map((p: any) => <option key={p.pair} value={p.pair}>{p.pair}</option>)}
          </select>
        </Field>
        <Field label="Strategy">
          <select className="input" value={strategy} onChange={e => setStrategy(e.target.value as StrategyName)}>
            {KNOWN_STRATEGIES.map(s => <option key={s.name} value={s.name}>{s.displayName}</option>)}
          </select>
        </Field>
        <Field label="Interval">
          <select className="input" value={interval} onChange={e => setInterval(e.target.value)}>
            {(intervalsQ.data ?? []).map((i: any) => <option key={i.label} value={i.label}>{i.displayName}</option>)}
          </select>
        </Field>

        <Field label="Start date">
          <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date">
          <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
        <Field label="Starting balance (€) — optional">
          <input className="input" type="number" placeholder="from config" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
        </Field>

        <Field label="TP % override">
          <input className="input" type="number" step="0.5" placeholder="from config" value={tpPct} onChange={e => setTpPct(e.target.value)} />
        </Field>
        <Field label="SL % override">
          <input className="input" type="number" step="0.5" placeholder="from config" value={slPct} onChange={e => setSlPct(e.target.value)} />
        </Field>
        <Field label="Fee rate override (e.g. 0.0009)">
          <input className="input" type="number" step="0.0001" placeholder="from config" value={feeRate} onChange={e => setFeeRate(e.target.value)} />
        </Field>

        <div style={{ gridColumn: 'span 3' }}>
          <button type="button" onClick={() => setAdvanced(v => !v)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 11, padding: '6px 0', textAlign: 'left',
          }}>
            {advanced ? '▼' : '▶'} Advanced (slippage{strategy === 'EMA_CROSSOVER' ? ' + EMA params' : ''})
          </button>
        </div>

        {advanced && (
          <>
            <Field label="Slippage rate override (e.g. 0.0005)">
              <input className="input" type="number" step="0.0001" placeholder="from config" value={slipRate} onChange={e => setSlipRate(e.target.value)} />
            </Field>
            {strategy === 'EMA_CROSSOVER' && (
              <>
                <Field label="EMA short period">
                  <input className="input" type="number" placeholder="9" value={emaShort} onChange={e => setEmaShort(e.target.value)} />
                </Field>
                <Field label="EMA long period">
                  <input className="input" type="number" placeholder="21" value={emaLong} onChange={e => setEmaLong(e.target.value)} />
                </Field>
                <Field label="RSI period">
                  <input className="input" type="number" placeholder="14" value={rsiPeriod} onChange={e => setRsiPeriod(e.target.value)} />
                </Field>
              </>
            )}
            {strategy !== 'EMA_CROSSOVER' && (
              <div style={{ gridColumn: 'span 2', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                Strategy params for {strategy} are hardcoded (Bollinger 20/2, MACD 12/26/9, etc.).
                Tunable from config in v1.5.
              </div>
            )}
          </>
        )}

        <Field label="Label (optional)">
          <input className="input" placeholder="auto-generated" value={label} onChange={e => setLabel(e.target.value)} />
        </Field>
        <Field label="Notes (optional)">
          <input className="input" placeholder="" value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={walkForwardOn} onChange={e => setWalkForwardOn(e.target.checked)} />
            Walk-forward
          </label>
          {walkForwardOn && (
            <input className="input" type="number" min={2} max={10} value={windows}
                   onChange={e => setWindows(e.target.value)} style={{ width: 60 }} />
          )}
        </div>
      </div>

      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? '⟳ Running…' : (walkForwardOn ? 'Run walk-forward' : 'Run backtest')}
        </button>
        {error && <span style={{ color: 'var(--red)', fontSize: 11 }}>✗ {error}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span className="label" style={{ fontSize: 9 }}>{label}</span>
      {children}
    </div>
  );
}

// ─── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: ResultMode }) {
  if (result == null) {
    return (
      <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        Run a backtest above, or click a saved run on the right →
      </div>
    );
  }
  if (result.kind === 'walkforward') {
    return <WalkForwardPanel result={result.result} />;
  }
  if (result.kind === 'loaded') {
    return <LoadedRunPanel id={result.id} />;
  }
  return <SingleRunPanel detail={result.detail} />;
}

function LoadedRunPanel({ id }: { id: string }) {
  const q = useBacktestRun(id);
  if (q.isLoading) return <div className="card" style={{ padding: 30, color: 'var(--text-muted)' }}>Loading…</div>;
  if (q.isError || !q.data) return <div className="card" style={{ padding: 30, color: 'var(--red)' }}>Failed to load run.</div>;
  return <SingleRunPanel detail={q.data} />;
}

function SingleRunPanel({ detail }: { detail: BacktestRunDetail }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontWeight: 600 }}>
            {detail.strategy} · {detail.pair} · {detail.interval}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {detail.startDate.slice(0, 10)} → {detail.endDate.slice(0, 10)} · €{Number(detail.startingBalance).toFixed(0)} start
          </span>
        </div>
        {detail.label && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{detail.label}</div>}
      </div>
      <StatsGrid stats={detail.stats} />
      <EquityChart points={detail.equityCurve} />
      <TradesTable trades={detail.trades} />
    </div>
  );
}

// ─── Stats grid ────────────────────────────────────────────────────────────────

function StatsGrid({ stats }: { stats: BacktestStats }) {
  return (
    <div className="card">
      <div className="card-header"><span className="label">Stats</span></div>
      <div className="card-body" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
      }}>
        <Tile label="Net PnL"     value={formatPnl(stats.netPnl)} colorize={stats.netPnl} headline />
        <Tile label="Gross PnL"   value={formatPnl(stats.totalPnl)} colorize={stats.totalPnl} />
        <Tile label="Win rate"    value={`${stats.winRate.toFixed(1)}%`} colorize={stats.winRate - 50} />
        <Tile label="Trades"      value={String(stats.totalTrades)} />
        <Tile label="Trades / mo" value={stats.tradesPerMonth.toFixed(1)} />

        <Tile label="Sharpe"      value={stats.sharpeRatio.toFixed(2)} colorize={stats.sharpeRatio} />
        <Tile label="Profit factor" value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)} colorize={stats.profitFactor - 1} />
        <Tile label="Expectancy"  value={`${formatPnl(stats.netExpectancy)}/trade`} colorize={stats.netExpectancy} />
        <Tile label="Max DD"      value={`${formatPnl(stats.maxDrawdown)} (${(stats.maxDrawdownPct * 100).toFixed(1)}%)`} colorize={-stats.maxDrawdown} />
        <Tile label="Max losing streak" value={String(stats.maxConsecutiveLosses)} colorize={-stats.maxConsecutiveLosses} />

        <Tile label="Best trade"  value={formatPnl(stats.bestTrade)} colorize={stats.bestTrade} />
        <Tile label="Worst trade" value={formatPnl(stats.worstTrade)} colorize={stats.worstTrade} />
        <Tile label="Total fees"  value={formatPnl(-stats.totalFees)} />
        <Tile label="Total slippage" value={formatPnl(-stats.totalSlippage)} />
        <ConfidenceTile t={stats.tStatistic} n={stats.totalTrades} />
      </div>
    </div>
  );
}

function Tile({ label, value, colorize, headline }: {
  label: string; value: string; colorize?: number; headline?: boolean;
}) {
  const color = colorize == null ? 'var(--text-primary)'
                : colorize > 0 ? 'var(--green)'
                : colorize < 0 ? 'var(--red)'
                : 'var(--text-secondary)';
  return (
    <div>
      <div className="label" style={{ fontSize: 9 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: headline ? 22 : 14,
        fontWeight: headline ? 700 : 600,
        color,
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

function ConfidenceTile({ t, n }: { t: number; n: number }) {
  let color = 'var(--text-muted)';
  let verdict = 'low';
  if (n >= 30 && t > 2)        { color = 'var(--green)'; verdict = 'high'; }
  else if (n >= 20 && t > 1.5) { color = 'var(--amber)'; verdict = 'medium'; }
  else if (n < 20)             { verdict = `low (n=${n})`; }
  return (
    <div>
      <div className="label" style={{ fontSize: 9 }}>Confidence</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color,
        }}>
          t={t.toFixed(2)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({verdict})</span>
      </div>
    </div>
  );
}

// ─── Equity curve ──────────────────────────────────────────────────────────────

function EquityChart({ points }: { points: EquityPoint[] }) {
  const data = useMemo(() => points.map(p => ({
    t: p.timestamp.slice(5, 16),
    equity: Number(p.equity),
    drawdown: -Number(p.drawdown),
  })), [points]);
  if (!data.length) return null;

  const equityValues = data.map(d => d.equity);
  const minE = Math.min(...equityValues);
  const maxE = Math.max(...equityValues);
  const padding = (maxE - minE) * 0.05;

  return (
    <div className="card">
      <div className="card-header"><span className="label">Equity curve & drawdown</span></div>
      <div style={{ height: 300, padding: 8 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
            <XAxis dataKey="t" stroke="var(--text-muted)" fontSize={10}
                   interval={Math.max(1, Math.floor(data.length / 8))} />
            <YAxis yAxisId="eq" stroke="var(--text-muted)" fontSize={10}
                   domain={[minE - padding, maxE + padding]}
                   tickFormatter={v => `€${Math.round(v)}`} />
            <YAxis yAxisId="dd" orientation="right" stroke="var(--text-muted)" fontSize={10}
                   tickFormatter={v => `€${Math.round(v)}`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 11 }}
              labelStyle={{ color: 'var(--text-muted)' }}
              formatter={(v: any, k: string) => [`€${Number(v).toFixed(2)}`, k]}
            />
            <ReferenceLine yAxisId="eq" y={equityValues[0]} stroke="var(--text-muted)"
                           strokeDasharray="4 4" label={{ value: 'start', position: 'left', fontSize: 9, fill: 'var(--text-muted)' }} />
            <Area yAxisId="dd" dataKey="drawdown" fill="var(--red)" stroke="none" fillOpacity={0.18} />
            <Line yAxisId="eq" type="monotone" dataKey="equity" stroke="var(--green)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Trades table ──────────────────────────────────────────────────────────────

function TradesTable({ trades }: { trades: SimulatedTrade[] }) {
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const filtered = reasonFilter ? trades.filter(t => t.exitReason === reasonFilter) : trades;
  const counts = trades.reduce((m, t) => { m[t.exitReason] = (m[t.exitReason] ?? 0) + 1; return m; }, {} as Record<string, number>);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="label">Trades ({trades.length})</span>
        <span style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {Object.entries(counts).map(([reason, n]) => (
            <button key={reason} type="button"
                    onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
                    className={`badge ${reasonFilter === reason ? 'badge-green' : 'badge-neutral'}`}
                    style={{ cursor: 'pointer', fontSize: 9 }}>
              {reason} {n}
            </button>
          ))}
          {reasonFilter && (
            <button type="button" onClick={() => setReasonFilter(null)}
                    className="badge badge-neutral" style={{ cursor: 'pointer', fontSize: 9 }}>clear</button>
          )}
        </span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 360 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 14 }}>#</th>
              <th>Opened</th>
              <th>Closed</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Net PnL</th>
              <th>%</th>
              <th>Exit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.sequence}>
                <td style={{ paddingLeft: 14, color: 'var(--text-muted)' }}>{t.sequence}</td>
                <td className="mono" style={{ fontSize: 10 }}>{t.executedAt.slice(5, 16)}</td>
                <td className="mono" style={{ fontSize: 10 }}>{t.closedAt.slice(5, 16)}</td>
                <td>{formatPrice(t.entryPrice)}</td>
                <td>{formatPrice(t.exitPrice)}</td>
                <td>
                  <span style={{ color: t.netPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {formatPnl(t.netPnl)}
                  </span>
                </td>
                <td>
                  <span style={{ color: t.netPnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatPct(t.netPnlPct)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${t.exitReason === 'TP_HIT' ? 'badge-green'
                                : t.exitReason === 'SL_HIT' ? 'badge-red'
                                : 'badge-neutral'}`}
                        style={{ fontSize: 9 }}>
                    {t.exitReason}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Walk-forward panel ────────────────────────────────────────────────────────

function WalkForwardPanel({ result }: { result: WalkForwardResult }) {
  const verdict = result.varianceMetrics.consistencyVerdict;
  const banner = verdict === 'STABLE'
    ? { color: 'var(--green)', label: 'STABLE',
        text: '✓ Edge holds across windows — likely real' }
    : verdict === 'REGIME_DEPENDENT'
    ? { color: 'var(--amber)', label: 'REGIME DEPENDENT',
        text: '⚠ Regime-dependent — works sometimes, not others' }
    : verdict === 'WILDLY_VARYING_HIGH_VARIANCE'
    ? { color: 'var(--amber)', label: 'WILDLY VARYING',
        text: '⚠ Mean is positive but stddev is high — edge inconsistent or sample too small to confirm' }
    : { color: 'var(--red)',   label: 'WILDLY VARYING',
        text: '✗ Mean negative across windows — likely no edge or overfit' };

  const totalConfigured = result.windows.length + result.skippedWindows.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ borderLeft: `3px solid ${banner.color}`, padding: '12px 16px' }}>
        <div style={{ color: banner.color, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
          {banner.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{banner.text}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          stddev — winRate: {result.varianceMetrics.winRateStdDev.toFixed(2)} · expectancy: {result.varianceMetrics.expectancyStdDev.toFixed(2)} · netPnl: €{result.varianceMetrics.netPnlStdDev.toFixed(2)}
          {totalConfigured > 0 && ` · ${result.windows.length}/${totalConfigured} windows ran`}
        </div>
      </div>

      {result.skippedWindows.length > 0 && (
        <div className="card" style={{
          borderLeft: '3px solid var(--amber)',
          padding: '10px 14px',
          background: 'color-mix(in srgb, var(--amber) 6%, transparent)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginBottom: 4 }}>
            ⚠ {result.skippedWindows.length} of {totalConfigured} window{totalConfigured === 1 ? '' : 's'} skipped — no candle data in range
          </div>
          {result.skippedWindows.map(sw => (
            <div key={sw.index} style={{
              fontSize: 10, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', marginTop: 2,
            }}>
              window {sw.index} · {sw.startDate.slice(0, 10)} → {sw.endDate.slice(0, 10)} · {sw.reason}
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            Tip: 15m candle history caps at ~47 days. For longer windows, switch to 1h or coarser.
          </div>
        </div>
      )}

      {result.windows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.windows.length}, 1fr)`, gap: 10 }}>
          {result.windows.map((w) => (
            <div key={w.id} className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                {w.startDate.slice(0, 10)} → {w.endDate.slice(0, 10)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div><span className="label" style={{ fontSize: 8 }}>Net PnL</span><br />
                  <span style={{ color: w.stats.netPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {formatPnl(w.stats.netPnl)}
                  </span>
                </div>
                <div><span className="label" style={{ fontSize: 8 }}>Win rate</span><br />
                  {w.stats.winRate.toFixed(1)}%
                </div>
                <div><span className="label" style={{ fontSize: 8 }}>Trades</span><br />
                  {w.stats.totalTrades}
                </div>
                <div><span className="label" style={{ fontSize: 8 }}>Sharpe</span><br />
                  {w.stats.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Runs sidebar ──────────────────────────────────────────────────────────────

function RunsHistorySidebar({ runs, onSelect, loading }: {
  runs: BacktestRunSummary[]; onSelect: (id: string) => void; loading: boolean;
}) {
  return (
    <div className="card" style={{
      position: 'sticky', top: 0, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="card-header"><span className="label">Saved runs ({runs.length})</span></div>
      {loading && <div style={{ padding: 14, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</div>}
      {!loading && runs.length === 0 && (
        <div style={{ padding: 14, fontSize: 11, color: 'var(--text-muted)' }}>
          No runs yet. Submit the form to run your first backtest.
        </div>
      )}
      {runs.map(r => (
        <button key={r.id} onClick={() => onSelect(r.id)} style={{
          background: 'none', border: 'none', borderTop: '1px solid var(--border)',
          padding: '8px 12px', textAlign: 'left', cursor: 'pointer',
          color: 'var(--text-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{r.strategy}</span>
            <span style={{
              fontSize: 11,
              color: r.stats.netPnl >= 0 ? 'var(--green)' : 'var(--red)',
              fontWeight: 600,
            }}>
              {formatPnl(r.stats.netPnl)}
            </span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {r.pair} · {r.interval} · {r.stats.totalTrades} trades · {r.stats.winRate.toFixed(0)}% win
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
            {r.createdAt.slice(0, 16)}
          </div>
        </button>
      ))}
    </div>
  );
}
