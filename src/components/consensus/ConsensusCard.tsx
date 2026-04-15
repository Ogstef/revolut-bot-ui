import type { ConsensusSummary } from '../../utils/consensus';
import type { StrategyName } from '../../api/client';
import ScoreMeter from './ScoreMeter';

interface Props {
  summary: ConsensusSummary;
  onSelectStrategy?: (name: StrategyName) => void;
}

export default function ConsensusCard({ summary, onSelectStrategy }: Props) {
  const { pair, interval, score, buy, hold, sell, dominant, perStrategy } = summary;

  const scoreColor =
    score > 0 ? 'var(--green)' : score < 0 ? 'var(--red)' : 'var(--text-secondary)';
  const scoreSign = score > 0 ? '+' : '';
  const scoreText = `SCORE ${scoreSign}${score.toFixed(0)}`;

  const arrow =
    dominant === 'BUY' ? '↑' : dominant === 'SELL' ? '↓' : '→';
  const arrowColor =
    dominant === 'BUY'
      ? 'var(--green)'
      : dominant === 'SELL'
        ? 'var(--red)'
        : 'var(--text-muted)';

  return (
    <div className="card">
      <div className="card-header">
        <span
          className="mono"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}
        >
          {pair} · {interval}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              color: scoreColor,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {scoreText}
          </span>
          <span
            style={{
              color: arrowColor,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {arrow}
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 14, padding: '10px 14px 0' }}>
        <CountPill label="BUY" value={buy} color="var(--green)" />
        <CountPill label="HOLD" value={hold} color="var(--text-secondary)" />
        <CountPill label="SELL" value={sell} color="var(--red)" />
      </div>

      <div style={{ padding: '10px 14px' }}>
        <ScoreMeter score={score} />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 14px 12px',
          alignItems: 'center',
        }}
      >
        {perStrategy.map(({ strategy, displayName, signalType, confidence }) => {
          const dotClass = signalType?.toLowerCase() ?? 'hold';
          const confSuffix =
            confidence != null ? ` · confidence ${confidence.toFixed(0)}%` : '';
          const title = `${displayName}${confSuffix} · ${signalType ?? 'none'}`;
          return (
            <span
              key={strategy}
              className={`strategy-dot ${dotClass}`}
              title={title}
              onClick={() => onSelectStrategy?.(strategy)}
              style={{ cursor: onSelectStrategy ? 'pointer' : 'default' }}
            />
          );
        })}
      </div>
    </div>
  );
}

function CountPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}
