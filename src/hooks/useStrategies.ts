import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchStrategies, fetchTrades, fetchStats, fetchPositions } from '../api/strategies';
import { fetchSignalSummary } from '../api/signals';
import { usePair } from '../context/PairContext';
import type { StrategyName } from '../api/client';

export function useStrategies(pair: string, interval?: string) {
  const { selectedVehicle } = usePair();
  return useQuery({
    queryKey: ['strategies', pair, interval, selectedVehicle],
    queryFn: () => fetchStrategies(pair, interval, selectedVehicle),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useAllStrategyTrades(pair: string, strategyNames: string[], interval?: string) {
  const { selectedVehicle } = usePair();
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['trades', name, pair, interval, selectedVehicle],
      queryFn: () => fetchTrades(name as StrategyName, pair, 500, interval, selectedVehicle),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyStats(pair: string, strategyNames: string[], interval?: string) {
  const { selectedVehicle } = usePair();
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['stats', name, pair, interval, selectedVehicle],
      queryFn: () => fetchStats(name as StrategyName, pair, interval, selectedVehicle),
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyPositions(pair: string, strategyNames: string[], interval?: string) {
  const { selectedVehicle } = usePair();
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['positions', name, pair, interval, selectedVehicle],
      queryFn: () => fetchPositions(name as StrategyName, pair, interval, selectedVehicle),
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useSignalSummary(pair: string, interval?: string) {
  return useQuery({
    queryKey: ['signals-summary', pair, interval],
    queryFn: () => fetchSignalSummary(pair, interval),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
