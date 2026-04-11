import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { SignalSummary } from '../../api/client';
import { STRATEGIES } from '../../api/client';

interface Props {
  signals: SignalSummary[] | undefined;
  isLoading: boolean;
}

function buildChartData(signals: SignalSummary[]) {
  return STRATEGIES.map(s => {
    const forStrategy = signals.filter(sig => sig.strategy === s.name);
    const buy  = forStrategy.find(sig => sig.signalType === 'BUY')?.count  ?? 0;
    const sell = forStrategy.find(sig => sig.signalType === 'SELL')?.count ?? 0;
    const hold = forStrategy.find(sig => sig.signalType === 'HOLD')?.count ?? 0;
    return { name: s.displayName, BUY: buy, SELL: sell, HOLD: hold };
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 2,
      padding: '8px 12px',
      fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill, marginBottom: 2 }}>
          {p.dataKey}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function SignalFrequencyChart({ signals, isLoading }: Props) {
  const data = buildChartData(signals ?? []);
  const isEmpty = !signals || signals.length === 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="label">Signal Frequency</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>BUY / SELL / HOLD per strategy</span>
      </div>

      <div style={{ flex: 1, padding: '12px 4px 8px 0', minHeight: 180 }}>
        {isLoading ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Loading…
          </div>
        ) : isEmpty ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No signal data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', paddingTop: 4 }} />
              <Bar dataKey="BUY"  fill="var(--green)"  radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Bar dataKey="SELL" fill="var(--red)"    radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Bar dataKey="HOLD" fill="var(--blue)"   radius={[2, 2, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
