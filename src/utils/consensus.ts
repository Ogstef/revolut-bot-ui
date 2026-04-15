import type { CurrentSignal, StrategyName } from '../api/client';

export interface ConsensusSummary {
  pair: string;
  interval: string;
  buy: number;
  hold: number;
  sell: number;
  total: number;
  /** Confidence-weighted signed score in [-100, +100]. */
  score: number;
  dominant: 'BUY' | 'SELL' | 'HOLD';
  perStrategy: Array<{
    strategy: StrategyName;
    displayName: string;
    signalType: 'BUY' | 'SELL' | 'HOLD' | null;
    confidence: number | null;
  }>;
}

export function computeConsensus(
  signals: CurrentSignal[],
  pair: string,
  interval: string,
): ConsensusSummary {
  const rows = signals.filter(s => s.pair === pair && s.interval === interval);
  let buy = 0, sell = 0, hold = 0;
  let weightedBuy = 0, weightedSell = 0;
  const perStrategy: ConsensusSummary['perStrategy'] = [];
  for (const s of rows) {
    const conf = s.confidence ?? 0;
    if (s.signalType === 'BUY') {
      buy++;
      weightedBuy += conf;
    } else if (s.signalType === 'SELL') {
      sell++;
      weightedSell += conf;
    } else {
      hold++;
    }
    perStrategy.push({
      strategy: s.strategy,
      displayName: s.displayName,
      signalType: s.signalType,
      confidence: s.confidence,
    });
  }
  const total = rows.length;
  const raw = total === 0 ? 0 : (weightedBuy - weightedSell) / total;
  const dominant: ConsensusSummary['dominant'] =
    buy > sell && buy > hold ? 'BUY'
    : sell > buy && sell > hold ? 'SELL'
    : 'HOLD';
  return {
    pair,
    interval,
    buy,
    hold,
    sell,
    total,
    score: Math.max(-100, Math.min(100, raw)),
    dominant,
    perStrategy,
  };
}
