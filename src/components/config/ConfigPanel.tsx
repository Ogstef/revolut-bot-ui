import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateConfig } from '../../api/strategies';
import type { ConfigUpdate } from '../../api/client';

const defaultConfig: Required<ConfigUpdate> = {
  maxPositionPct: 2,
  maxConcurrentPositions: 3,
  maxDailyLossPct: 5,
  maxConsecutiveLosses: 5,
  takeProfitPct: 5,
  stopLossPct: 3,
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  paperBalance: 10000,
};

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<Required<ConfigUpdate>>(defaultConfig);
  const [saved, setSaved] = useState(false);

  const mut = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function set(key: keyof ConfigUpdate, val: string) {
    setCfg(c => ({ ...c, [key]: parseFloat(val) || 0 }));
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="label">Runtime Config</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Applies to all strategies</span>
      </div>

      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <Section label="Risk Management">
          <Field label="Max Position %" value={cfg.maxPositionPct} onChange={v => set('maxPositionPct', v)} step="0.5" />
          <Field label="Max Concurrent Pos" value={cfg.maxConcurrentPositions} onChange={v => set('maxConcurrentPositions', v)} step="1" />
          <Field label="Max Daily Loss %" value={cfg.maxDailyLossPct} onChange={v => set('maxDailyLossPct', v)} step="0.5" />
          <Field label="Max Consec. Losses" value={cfg.maxConsecutiveLosses} onChange={v => set('maxConsecutiveLosses', v)} step="1" />
        </Section>

        <Section label="Take Profit / Stop Loss">
          <Field label="Take Profit %" value={cfg.takeProfitPct} onChange={v => set('takeProfitPct', v)} step="0.5" />
          <Field label="Stop Loss %" value={cfg.stopLossPct} onChange={v => set('stopLossPct', v)} step="0.5" />
        </Section>

        <Section label="EMA Strategy">
          <Field label="EMA Short Period" value={cfg.emaShortPeriod} onChange={v => set('emaShortPeriod', v)} step="1" />
          <Field label="EMA Long Period" value={cfg.emaLongPeriod} onChange={v => set('emaLongPeriod', v)} step="1" />
        </Section>

        <Section label="RSI Settings">
          <Field label="RSI Period" value={cfg.rsiPeriod} onChange={v => set('rsiPeriod', v)} step="1" />
          <Field label="RSI Overbought" value={cfg.rsiOverbought} onChange={v => set('rsiOverbought', v)} step="1" />
          <Field label="RSI Oversold" value={cfg.rsiOversold} onChange={v => set('rsiOversold', v)} step="1" />
        </Section>

        <Section label="Paper Trading">
          <Field label="Paper Balance (€)" value={cfg.paperBalance} onChange={v => set('paperBalance', v)} step="100" />
        </Section>
      </div>

      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button className="btn btn-primary" onClick={() => mut.mutate(cfg)} disabled={mut.isPending}>
          {mut.isPending ? '⟳ Saving…' : '↑ Save Config'}
        </button>
        <button className="btn btn-ghost" onClick={() => setCfg(defaultConfig)}>
          Reset Defaults
        </button>
        {saved && (
          <span className="animate-fade-in" style={{ fontSize: 11, color: 'var(--green)' }}>
            ✓ Config saved — takes effect next cycle
          </span>
        )}
        {mut.isError && (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>✗ Failed to save</span>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, step }: {
  label: string; value: number; onChange: (v: string) => void; step: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</span>
      </label>
      <input
        className="input"
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '5px 8px', fontSize: 12 }}
      />
    </div>
  );
}
