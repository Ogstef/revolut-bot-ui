interface Props {
  score: number;
}

export default function ScoreMeter({ score }: Props) {
  const clamped = Math.max(-100, Math.min(100, score));
  const isPositive = clamped >= 0;
  const magnitude = Math.abs(clamped);
  const widthPct = magnitude / 2;
  const leftPct = isPositive ? 50 : 50 - widthPct;
  const fillBackground = isPositive ? 'var(--green)' : 'var(--red)';
  const tickLeft = 50 + clamped / 2;

  return (
    <div className="score-meter">
      <div className="score-meter-axis" />
      <div
        className="score-meter-fill"
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          background: fillBackground,
        }}
      />
      <div
        className="score-meter-tick"
        style={{ left: `${tickLeft}%` }}
      />
    </div>
  );
}
