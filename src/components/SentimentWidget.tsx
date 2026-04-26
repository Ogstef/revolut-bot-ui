import { useSentiment } from '../hooks/useSentiment';
import { usePair } from '../context/PairContext';
import type { SentimentSource } from '../api/client';

/**
 * Header widget. Primary COMBINED score as a -1…+1 gauge (red → grey → green);
 * two small sub-badges show the Reddit and CryptoPanic component scores so
 * single-source outages are visible at a glance.
 */
export default function SentimentWidget() {
  const { selectedPair } = usePair();
  const { data, isLoading, isError } = useSentiment(selectedPair, 'COMBINED');

  if (isLoading)         return <Shell label="Sentiment" value="…" color="var(--text-muted)" glow="none" />;
  if (isError || !data)  return <Shell label="no data"   value="—" color="var(--text-muted)" glow="none" />;

  const tone = scoreTone(data.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span className="label">Sentiment</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: tone.color,
          textShadow: `0 0 8px ${tone.glow}`,
        }}>
          {data.score != null ? formatScore(data.score) : '—'}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tone.color,
          opacity: 0.85,
        }}>
          {data.stale ? 'low data' : tone.label}
        </span>
      </div>
      <Gauge score={data.score} color={tone.color} glow={tone.glow} />
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {data.subScores?.map(sub => (
          <SubBadge key={sub.source} source={sub.source} score={sub.score} sampleSize={sub.sampleSize} />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function scoreTone(score: number | null) {
  if (score == null) return { color: 'var(--text-muted)', glow: 'rgba(255,255,255,0)', label: 'insufficient' };
  if (score <= -0.4) return { color: '#ff3d5a', glow: 'rgba(255,61,90,0.5)',  label: 'Bearish' };
  if (score <= -0.1) return { color: '#ff8c00', glow: 'rgba(255,140,0,0.5)',  label: 'Fearful' };
  if (score <   0.1) return { color: '#ffb800', glow: 'rgba(255,184,0,0.4)',  label: 'Neutral' };
  if (score <   0.4) return { color: '#7ed957', glow: 'rgba(126,217,87,0.5)', label: 'Hopeful' };
  return                      { color: '#00e676', glow: 'rgba(0,230,118,0.6)',  label: 'Bullish' };
}

function formatScore(score: number): string {
  return (score >= 0 ? '+' : '') + score.toFixed(2);
}

function Gauge({ score, color, glow }: { score: number | null; color: string; glow: string }) {
  // Map score in [-1, +1] to [0, 100] for the bar width
  const filled = score == null ? 0 : Math.max(0, Math.min(100, (score + 1) * 50));
  return (
    <div style={{
      width: 80, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
      position: 'relative', marginTop: 2,
    }}>
      <div style={{
        width: `${filled}%`,
        height: '100%',
        background: color,
        boxShadow: score != null ? `0 0 4px ${glow}` : undefined,
        borderRadius: 2,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function SubBadge({ source, score, sampleSize }: { source: SentimentSource; score: number | null; sampleSize: number }) {
  const tone = scoreTone(score);
  const letter = source === 'REDDIT' ? 'R' : source === 'CRYPTOPANIC' ? 'CP' : '';
  return (
    <span
      title={`${source}: ${score != null ? formatScore(score) : 'n/a'} (n=${sampleSize})`}
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: tone.color,
        padding: '1px 4px',
        borderRadius: 3,
        background: `color-mix(in srgb, ${tone.color} 18%, transparent)`,
        letterSpacing: '0.04em',
      }}
    >
      {letter}{score != null ? ' ' + formatScore(score) : ''}
    </span>
  );
}

function Shell({ value, label, color, glow }: { value: string; label: string; color: string; glow: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span className="label">Sentiment</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color, textShadow: glow !== 'none' ? `0 0 8px ${glow}` : undefined }}>{value}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ width: 80, height: 3, background: 'var(--border)', borderRadius: 2 }} />
    </div>
  );
}
