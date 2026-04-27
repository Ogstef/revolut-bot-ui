import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StrategyName, TripleStats } from '../api/client';
import { disableTriple, enableTriple } from '../api/strategies';

interface ToggleArgs {
  pair: string;
  strategy: StrategyName;
  interval: string;
  enabled: boolean;        // desired NEW state
  reason?: string;
}

const QUERY_KEY = ['all-triple-stats'] as const;

export function useTripleToggle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pair, strategy, interval, enabled, reason }: ToggleArgs) => {
      if (enabled) {
        return enableTriple(pair, strategy, interval);
      }
      return disableTriple(pair, strategy, interval, reason);
    },

    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<TripleStats[]>(QUERY_KEY);
      if (prev) {
        qc.setQueryData<TripleStats[]>(QUERY_KEY, prev.map(r =>
          r.pair === args.pair && r.strategy === args.strategy && r.interval === args.interval
            ? { ...r, enabled: args.enabled }
            : r
        ));
      }
      return { prev };
    },

    onError: (_err, _args, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['disabled-triples'] });
    },
  });
}
