import { useFearGreed } from '../hooks/useFearGreed';

const ZONES = [
  { max: 24,  label: 'Extreme Fear', color: '#ff3d5a', glow: 'rgba(255,61,90,0.5)' },
  { max: 44,  label: 'Fear',         color: '#ff8c00', glow: 'rgba(255,140,0,0.5)' },
  { max: 55,  label: 'Neutral',      color: '#ffb800', glow: 'rgba(255,184,0,0.4)' },
  { max: 74,  label: 'Greed',        color: '#7ed957', glow: 'rgba(126,217,87,0.5)' },
  { max: 100, label: 'Extreme Greed',color: '#00e676', glow: 'rgba(0,230,118,0.6)' },
];

function zone(value: number) {
  return ZONES.find(z => value <= z.max) ?? ZONES[ZONES.length - 1];
}

export default function FearGreedWidget() {
  const { data, isLoading, isError } = useFearGreed();

  if (isLoading) return <FearGreedShell value="…" label="Fear & Greed" color="var(--text-muted)" glow="none" />;
  if (isError || !data) return <FearGreedShell value="—" label="F&G unavailable" color="var(--text-muted)" glow="none" />;

  const z = zone(data.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span className="label">Fear & Greed</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        {/* Numeric value */}
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: z.color,
          textShadow: `0 0 8px ${z.glow}`,
        }}>
          {data.value}
        </span>
        {/* Classification label */}
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: z.color,
          opacity: 0.85,
        }}>
          {data.classification}
        </span>
      </div>
      {/* Mini gauge bar */}
      <div style={{
        width: 80,
        height: 3,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 2,
      }}>
        <div style={{
          width: `${data.value}%`,
          height: '100%',
          background: z.color,
          boxShadow: `0 0 4px ${z.glow}`,
          borderRadius: 2,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function FearGreedShell({ value, label, color, glow }: {
  value: string; label: string; color: string; glow: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span className="label">Fear & Greed</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color, textShadow: glow !== 'none' ? `0 0 8px ${glow}` : undefined }}>{value}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ width: 80, height: 3, background: 'var(--border)', borderRadius: 2 }} />
    </div>
  );
}
