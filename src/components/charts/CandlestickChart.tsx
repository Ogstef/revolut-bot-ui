import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, createSeriesMarkers, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, ISeriesMarkersPluginApi, IPriceLine, SeriesMarker, UTCTimestamp, CandlestickData, Time } from 'lightweight-charts';
import type { CandleBar, TradeHistoryEntry, Position } from '../../api/client';

interface Props {
  candles: CandleBar[];
  trades: TradeHistoryEntry[];
  positions?: Position[];
  showEntries: boolean;
  showExits: boolean;
  height?: number;
}

/**
 * Snap a raw epoch-seconds timestamp to the nearest candle bar time.
 * Even though lightweight-charts does internal snapping, doing it explicitly
 * ensures markers that fall between candle boundaries attach to a valid bar.
 */
function snapToNearestCandle(epochSec: number, candleTimes: number[]): UTCTimestamp {
  if (candleTimes.length === 0) return epochSec as UTCTimestamp;
  let best = candleTimes[0];
  let bestDiff = Math.abs(epochSec - best);
  for (const t of candleTimes) {
    const diff = Math.abs(epochSec - t);
    if (diff < bestDiff) {
      best = t;
      bestDiff = diff;
    }
  }
  return best as UTCTimestamp;
}

function buildMarkers(
  trades: TradeHistoryEntry[],
  candleTimes: number[],
  showEntries: boolean,
  showExits: boolean,
): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];

  for (const t of trades) {
    if (showEntries && t.executedAt) {
      const rawEpoch = Math.floor(new Date(t.executedAt).getTime() / 1000);
      const entryTime = snapToNearestCandle(rawEpoch, candleTimes);
      markers.push({
        time: entryTime as Time,
        position: t.side === 'BUY' ? 'belowBar' : 'aboveBar',
        shape: t.side === 'BUY' ? 'arrowUp' : 'arrowDown',
        color: t.side === 'BUY' ? '#00e676' : '#ff3d5a',
        text: t.side === 'BUY' ? 'B' : 'S',
        size: 1,
      });
    }

    if (showExits && t.closedAt) {
      const rawEpoch = Math.floor(new Date(t.closedAt).getTime() / 1000);
      const exitTime = snapToNearestCandle(rawEpoch, candleTimes);
      const exitColor =
        t.exitReason === 'TP_HIT'      ? '#00e676' :
        t.exitReason === 'SL_HIT'      ? '#ff3d5a' :
        t.exitReason === 'SIGNAL_EXIT' ? '#ffa726' : '#9e9e9e';
      markers.push({
        time: exitTime as Time,
        position: t.side === 'BUY' ? 'aboveBar' : 'belowBar',
        shape: 'circle',
        color: exitColor,
        text: t.exitReason === 'TP_HIT' ? 'TP' : t.exitReason === 'SL_HIT' ? 'SL' : 'X',
        size: 1,
      });
    }
  }

  return markers.sort((a, b) => (a.time as number) - (b.time as number));
}

export default function CandlestickChart({ candles, trades, positions = [], showEntries, showExits, height = 520 }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<IChartApi | null>(null);
  const seriesRef     = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef    = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  // Track price lines so we can remove+recreate them when positions change
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Create chart + markers plugin once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(180,180,180,0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:       '#00e676',
      downColor:     '#ff3d5a',
      borderVisible: false,
      wickUpColor:   '#00e676',
      wickDownColor: '#ff3d5a',
    });

    // v5: markers are a separate plugin
    const markersPlugin = createSeriesMarkers(series);

    chartRef.current   = chart;
    seriesRef.current  = series;
    markersRef.current = markersPlugin;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current    = null;
      seriesRef.current   = null;
      markersRef.current  = null;
      priceLinesRef.current = [];
    };
  }, [height]);

  // Update candle data
  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    // CandleBar.time is UTCTimestamp (number in seconds), matching CandlestickData<Time>
    seriesRef.current.setData(candles as unknown as CandlestickData<Time>[]);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Update trade entry/exit markers
  useEffect(() => {
    if (!markersRef.current) return;
    const candleTimes = candles.map(c => c.time);
    markersRef.current.setMarkers(buildMarkers(trades, candleTimes, showEntries, showExits));
  }, [trades, candles, showEntries, showExits]);

  // Render open-position price lines (entry, TP, SL)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove previous price lines
    for (const line of priceLinesRef.current) {
      try { series.removePriceLine(line); } catch { /* already removed on chart destruction */ }
    }
    priceLinesRef.current = [];

    // Add new price lines for each open position
    for (const pos of positions) {
      const entryLine = series.createPriceLine({
        price:            pos.entryPrice,
        color:            pos.side === 'BUY' ? '#00e676' : '#ff3d5a',
        lineWidth:        1,
        lineStyle:        LineStyle.Solid,
        axisLabelVisible: true,
        title:            `Entry ${pos.side}`,
      });
      priceLinesRef.current.push(entryLine);

      const tpLine = series.createPriceLine({
        price:            pos.takeProfit,
        color:            '#00e676',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'TP',
      });
      priceLinesRef.current.push(tpLine);

      const slLine = series.createPriceLine({
        price:            pos.stopLoss,
        color:            '#ff3d5a',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'SL',
      });
      priceLinesRef.current.push(slLine);
    }
  }, [positions]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, position: 'relative' }}
    />
  );
}
