# Revolut Trading Bot — Frontend

> **See also:** Root [`/CLAUDE.md`](../CLAUDE.md) for project-wide context (execution unit, how to run, API overview).
> Backend-specific instructions are in [`revolut-trading-bot/CLAUDE.md`](../revolut-trading-bot/CLAUDE.md).
> **HTTP contract with the backend:** [`../API_CONTRACT.md`](../API_CONTRACT.md) is the single source of truth for endpoints, DTOs, enums, and query-param conventions. Keep `src/api/client.ts` in sync with it — when a field/endpoint changes on either side, update the contract file in the same PR.

## Overview

React/TypeScript dashboard for the Revolut Trading Bot Spring Boot backend.
The backend runs on `http://localhost:8089`. All data comes from it — this UI never calls Revolut directly.

**The bot runs 12 strategies × N pairs × N intervals simultaneously — each `(pair, strategy, interval)` combination is an independent virtual portfolio.**
The UI lets you pick a pair and an interval from dropdowns, then browse each strategy's performance in its own tab. A cross-interval comparison view shows the same strategy's performance across different timeframes.

## Tech Stack

- **React 19 + TypeScript**
- **Vite** — dev server + build
- **TanStack Query (React Query)** — data fetching, caching, polling
- **Recharts** — PnL line charts, signal frequency bar charts
- **Tailwind CSS** — styling
- **shadcn/ui** — component library built on Radix UI

Bootstrap command:
```bash
npm create vite@latest . -- --template react-ts
npm install @tanstack/react-query recharts tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

---

## Strategies

12 strategies total. These are the exact string values used as path params in `/api/strategies/{name}`.
Fetch the live list from `GET /api/strategies` — do NOT hardcode the array.

| Path param | Display name | Logic summary |
|---|---|---|
| `EMA_CROSSOVER` | EMA Crossover | EMA(9) crosses EMA(21) + RSI filter |
| `MACD` | MACD | MACD histogram crosses zero |
| `BOLLINGER` | Bollinger Bands | Price bounces off upper/lower bands |
| `RSI_MOMENTUM` | RSI Momentum | RSI crosses 30 (oversold) or 70 (overbought) |
| `STOCH_RSI` | Stochastic RSI | StochRSI crosses 20 (oversold) or 80 (overbought) |
| `TRIPLE_EMA` | Triple EMA | EMA5 > EMA13 > EMA34 full alignment |
| `PARABOLIC_SAR` | Parabolic SAR | Price flips above/below the SAR trailing dot |
| `ADX_DI` | ADX + DI | +DI/-DI crossover only when ADX > 25 (strong trend) |
| `CCI` | CCI | CCI crosses −100 (oversold) or +100 (overbought) |
| `MFI` | Money Flow Index | Volume-weighted RSI, crosses 20 or 80 |
| `DONCHIAN` | Donchian Breakout | Price breaks above/below 20-bar channel |
| `ICHIMOKU` | Ichimoku Cloud | Multi-condition: TK cross + cloud + price position |

### Strategy indicator field mapping

Each strategy repurposes the `emaShort`, `emaLong`, and `rsi` fields on the signal object to carry its most relevant indicator values. The UI must display these differently per strategy — use the table below to know what each field actually means:

| Strategy | `emaShort` | `emaLong` | `rsi` |
|---|---|---|---|
| `EMA_CROSSOVER` | EMA9 | EMA21 | RSI(14) |
| `MACD` | MACD line | Signal line | Histogram |
| `BOLLINGER` | Upper band | Lower band | %B (0–100) |
| `RSI_MOMENTUM` | — | — | RSI(14) |
| `STOCH_RSI` | StochRSI × 100 | — | Underlying RSI |
| `TRIPLE_EMA` | EMA5 | EMA34 | EMA13 (middle) |
| `PARABOLIC_SAR` | SAR value | — | Price−SAR distance % |
| `ADX_DI` | +DI | −DI | ADX ← show this prominently |
| `CCI` | — | — | CCI value (can be outside 0–100) |
| `MFI` | — | — | MFI value (0–100, display like RSI) |
| `DONCHIAN` | Upper channel | Lower channel | Channel width % |
| `ICHIMOKU` | Tenkan-sen | Kijun-sen | Span A |

Use a `getIndicatorLabels(strategyName)` helper function that returns display labels for each field so the signal history table and strategy header show the right column names.

---

## Pairs

Fetched dynamically from `GET /api/pairs`. Do NOT hardcode pair names.
Typical response:
```json
[
  { "pair": "BTC-EUR", "baseAsset": "BTC", "quoteAsset": "EUR" },
  { "pair": "ETH-EUR", "baseAsset": "ETH", "quoteAsset": "EUR" },
  { "pair": "SOL-EUR", "baseAsset": "SOL", "quoteAsset": "EUR" }
]
```

The selected pair is global UI state — a dropdown in the header. Every data query uses the currently selected pair as a `?pair=` query param.

---

## Intervals

Fetched dynamically from `GET /api/intervals`. Do NOT hardcode interval values.
Typical response:
```json
[
  { "minutes": 15,    "label": "15m", "displayName": "15 min" },
  { "minutes": 60,    "label": "1h",  "displayName": "1 hour" },
  { "minutes": 240,   "label": "4h",  "displayName": "4 hours" },
  { "minutes": 1440,  "label": "1d",  "displayName": "1 day" },
  { "minutes": 10080, "label": "1w",  "displayName": "1 week" }
]
```

The selected interval is global UI state — a dropdown in the header next to the pair selector. Every data query uses the currently selected interval as an `?interval=` query param. When changing interval, all data re-fetches automatically (interval is part of every React Query key).

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Pair: [BTC-EUR ▼]  Interval: [15m ▼]   ● RUNNING   [STOP] [RESUME]            │
│  NAV: [Overview] [Portfolio] [EMA] [MACD] [Bollinger] [RSI] [StochRSI] [3-EMA]  │
│       [SAR] [ADX] [CCI] [MFI] [Donchian] [Ichimoku]                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

With 12 strategy tabs the nav will overflow on small screens — use a scrollable horizontal tab bar or a tab dropdown (shadcn `Select`) that collapses the strategy list on mobile.

The **pair dropdown** and **interval dropdown** live in the header, always visible. Changing either re-fetches all data on the current tab. Store selected pair and interval in React state (or URL query param so it's bookmarkable).

Top-level views:
- **Overview** — all 12 strategies for the selected pair + interval, side by side, plus a cross-interval comparison section
- **Portfolio** — aggregated view across all strategies (optionally across all intervals)
- **History** — forensic per-(pair, strategy, interval) trade-by-trade analytics with date filters, KPI strip, equity/drawdown chart, monthly heatmap, exit-reason donut, duration histogram, R-multiple distribution, day×hour heatmap, streak timeline, and a sortable/filterable/expandable trade table (see Page 3 below)
- **Signals** — full `pair × strategy × interval` matrix of the latest signal each strategy has produced, with a click-to-expand reason, confidence, indicators, and relative timestamp. Ignores the global pair/interval selectors (shows everything at once). Backed by `GET /api/signals/current` + `useCurrentSignals` hook; rendered by `src/pages/CurrentSignalsPage.tsx`.
- **Strategy tabs** — one tab per strategy, scoped to the selected pair + interval

---

## Page 1 — Overview (default landing)

Compares all 12 strategies for the currently selected pair and interval.

```
┌────────────────────────────────────────────────────────────────────┐
│  BTC-EUR | PAPER | ● RUNNING | [STOP] [RESUME]                    │
│  Daily PnL (all): -€12.50 | Circuit breakers active: 1/9         │
├──────────────────────────────────────────────────────────────────  │
│  STRATEGY CARDS — 3×3 grid (or 2 rows of 4+5)                     │
│  Each card shows:                                                  │
│    Strategy name | Daily PnL | Open positions                     │
│    Win rate | ● OK or ⚠ CIRCUIT BREAK                             │
├────────────────────────────────────────────────────────────────────┤
│  CUMULATIVE PNL CHART                                              │
│  9 lines, one per strategy — use distinct colours                  │
│  Toggle: All time | Monthly | Weekly                               │
│  Tip: add a legend with checkboxes to show/hide individual lines  │
│  (9 lines on one chart is busy — hide/show helps readability)     │
├────────────────────────────────────────────────────────────────────┤
│  SIGNAL FREQUENCY — grouped bar chart                              │
│  X axis: strategy (abbreviated)  Y axis: count                    │
│  Groups: BUY (green) / SELL (red) / HOLD (grey)                   │
│  Source: GET /api/signals/summary?pair={pair}                     │
├────────────────────────────────────────────────────────────────────┤
│  LEADERBOARD TABLE — sortable by any column                        │
│  Strategy | Total trades | Win rate | Total PnL | Expectancy      │
│  Highlight the top performer row in each column                   │
│  Source: GET /api/strategies/{name}/stats for each strategy       │
└────────────────────────────────────────────────────────────────────┘
```

**Data sources:**
- Strategy cards + leaderboard: `GET /api/strategies?pair={pair}` + `GET /api/strategies/{name}/stats?pair={pair}` for all 9 (poll 30s)
- Cumulative PnL chart: `GET /api/strategies/{name}/trades?pair={pair}&limit=500` for all 9, compute running sum on frontend
- Signal chart: `GET /api/signals/summary?pair={pair}` (poll 60s)

---

## Page 3 — History & Analytics Tab

A dedicated forensic view of every closed position for a given `(pair, strategy, interval)`. Pair and interval come from the global header; the strategy is selected via a chip row inside the page. A date-range chip strip (7D / 30D / 90D / YTD / All) narrows the dataset.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header: BTC-EUR | 15m | EMA Crossover                                 │
│  Strategy chips: [EMA] [MACD] … [Ichimoku]                             │
│  Date chips:     [7D] [30D] [90D] [YTD] [ALL]                          │
├─────────────────────────────────────────────────────────────────────────┤
│  KPI strip (8 cards): Total / Win% / Net PnL / PF / Expectancy /       │
│                       Avg hold / Max DD / Longest streak               │
├─────────────────────────────────────────────────────────────────────────┤
│  Equity curve + drawdown overlay (ComposedChart, dual Y axis)          │
├─────────────────────────────────────────────────────────────────────────┤
│  2×3 grid: Monthly returns heatmap | Exit-reason donut                 │
│            Duration histogram      | R-multiple distribution            │
│            Day × hour PnL heatmap  | Win/loss streak timeline           │
├─────────────────────────────────────────────────────────────────────────┤
│  Filter bar: side | exit reason | wins/losses | search signal reason   │
│  Trade table: sortable, click-to-expand → entry signal reason, TP/SL,  │
│  duration, R-multiple, all timestamps                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data source:** `GET /api/strategies/{name}/history?pair=&interval=&from=&to=` → `TradeHistoryEntry[]`. The hook is `useHistory` (poll 60s, paused in background). All chart maths live in `src/utils/analytics.ts` (pure functions). Components live in `src/components/history/`.

---

## Page 2 — Strategy Detail Tab

Same structure for all 4 tabs, data scoped to selected pair + strategy.

```
┌──────────────────────────────────────────────────────────────────┐
│  EMA Crossover — BTC-EUR                                         │
│  Win Rate: 63% | Expectancy: €4.20/trade | Daily: +€8.20        │
│  Best trade: +€28.50 | Worst: -€15.20 | Total trades: 34        │
├──────────────────────────┬───────────────────────────────────────┤
│  OPEN POSITIONS          │  CUMULATIVE PNL CHART                 │
│  Entry | Now | PnL | %   │  Single line for this strategy+pair   │
│  [TP progress bar]       │                                       │
│  [SL progress bar]       │                                       │
│  Signal reason tooltip   │                                       │
├──────────────────────────┼───────────────────────────────────────┤
│  RECENT TRADES (last 50) │  PNL BREAKDOWN                        │
│  Date | Side | Entry     │  Today:    +€8.20                     │
│  Exit | PnL | PnL%       │  This week: +€38.20                   │
│  [Exit reason badge]     │  This month: +€142.80                 │
│                          │  All time:  +€142.80                  │
├──────────────────────────┴───────────────────────────────────────┤
│  RECENT SIGNALS (last 20)                                        │
│  Time | Signal | Reason | RSI | EMA values | Price              │
│  Source: GET /api/strategies/{name}/signals?pair={pair}&limit=20 │
└──────────────────────────────────────────────────────────────────┘
```

**Data sources (all include `?pair={selectedPair}`):**
- Header stats: `GET /api/strategies/{name}/stats?pair={pair}` (poll 30s)
- Open positions: `GET /api/strategies/{name}/positions?pair={pair}` (poll 15s)
- Trades: `GET /api/strategies/{name}/trades?pair={pair}&limit=50` (poll 30s)
- PnL breakdown: `GET /api/strategies/{name}/pnl?pair={pair}` (poll 60s)
- Signals: `GET /api/strategies/{name}/signals?pair={pair}&limit=20` (poll 30s)

---

## Full API Contract

> **Canonical source:** [`../API_CONTRACT.md`](../API_CONTRACT.md). The examples below are a quick-reference duplicate — if they diverge from the canonical file, the canonical file wins. Update both when fields change.

Base URL: `http://localhost:8089`
CORS is already configured for `http://localhost:5173`.

---

### GET /api/pairs
List of all configured trading pairs. Fetch once on app load, use to populate the pair dropdown.
```json
[
  { "pair": "BTC-EUR", "baseAsset": "BTC", "quoteAsset": "EUR" },
  { "pair": "ETH-EUR", "baseAsset": "ETH", "quoteAsset": "EUR" },
  { "pair": "SOL-EUR", "baseAsset": "SOL", "quoteAsset": "EUR" }
]
```

---

### GET /api/intervals
List of all configured candle intervals. Fetch once on app load, use to populate the interval dropdown.
```json
[
  { "minutes": 15,    "label": "15m", "displayName": "15 min" },
  { "minutes": 60,    "label": "1h",  "displayName": "1 hour" },
  { "minutes": 240,   "label": "4h",  "displayName": "4 hours" },
  { "minutes": 1440,  "label": "1d",  "displayName": "1 day" },
  { "minutes": 10080, "label": "1w",  "displayName": "1 week" }
]
```

---

### GET /api/status
Global bot health. Poll every 10s for the header.
```json
{
  "running": true,
  "mode": "PAPER",
  "pair": "BTC-EUR",
  "openPositions": 3,
  "dailyPnl": -12.50,
  "consecutiveLosses": 2,
  "circuitBreakerOn": false,
  "reportedAt": "2025-04-11T14:23:01.123Z"
}
```

---

### GET /api/strategies?pair={pair}&interval={interval}
All 12 strategies with their current snapshot for the selected pair + interval. Use for Overview cards. `interval` is optional (defaults to primary interval).
```json
[
  {
    "name": "EMA_CROSSOVER",
    "displayName": "EMA Crossover",
    "openPositions": 1,
    "dailyPnl": 8.20,
    "consecutiveLosses": 0,
    "circuitBreakerActive": false
  },
  {
    "name": "MACD",
    "displayName": "MACD",
    "openPositions": 0,
    "dailyPnl": -4.10,
    "consecutiveLosses": 1,
    "circuitBreakerActive": false
  }
]
```

---

### GET /api/strategies/{name}/positions?pair={pair}&interval={interval}
Open positions for one strategy + pair + interval with live unrealised PnL. `interval` is optional.
```json
[
  {
    "id": 42,
    "pair": "BTC-EUR",
    "side": "BUY",
    "entryPrice": 85000.00,
    "quantity": 0.00235294,
    "takeProfit": 89250.00,
    "stopLoss": 82450.00,
    "currentPrice": 86200.00,
    "unrealisedPnl": 2.82,
    "unrealisedPnlPct": 1.41,
    "signalReason": "EMA9 crossed above EMA21 | RSI=52.3",
    "openedAt": "2025-04-10T12:00:00"
  }
]
```

**TP/SL progress bar logic:**
```
range = takeProfit - stopLoss
progress = (currentPrice - stopLoss) / range   // 0.0 = at SL, 1.0 = at TP
```
Show as a coloured bar. Red zone < 0.33, amber 0.33–0.66, green > 0.66.

---

### GET /api/strategies/{name}/trades?pair={pair}&interval={interval}&limit=50
Closed trades for one strategy + pair + interval. `interval` is optional.
```json
[
  {
    "id": 17,
    "pair": "BTC-EUR",
    "side": "BUY",
    "entryPrice": 83000.00,
    "exitPrice": 87150.00,
    "quantity": 0.00240964,
    "pnl": 10.00,
    "pnlPct": 5.00,
    "exitReason": "TP_HIT",
    "strategyName": "EMA_CROSSOVER",
    "tradingMode": "PAPER",
    "executedAt": "2025-04-09T18:45:00"
  }
]
```

Exit reason badge colours:
- `TP_HIT` → green — "Take Profit"
- `SL_HIT` → red — "Stop Loss"
- `SIGNAL_EXIT` → amber — "Signal Exit"
- `MANUAL` → grey — "Manual"

---

### GET /api/strategies/{name}/stats?pair={pair}&interval={interval}
`interval` is optional (defaults to primary interval).
```json
{
  "totalTrades": 34,
  "winningTrades": 21,
  "losingTrades": 13,
  "winRate": 61.76,
  "totalPnl": 142.80,
  "averageWin": 12.40,
  "averageLoss": -6.30,
  "bestTrade": 28.50,
  "worstTrade": -15.20,
  "expectancy": 5.32
}
```

---

### GET /api/strategies/{name}/pnl?pair={pair}&interval={interval}
`interval` is optional (defaults to primary interval).
```json
{
  "daily": 8.20,
  "weekly": 38.20,
  "monthly": 142.80,
  "allTime": 142.80
}
```

---

### GET /api/strategies/{name}/signals?pair={pair}&interval={interval}&limit=20
Recent signal evaluations for one strategy + pair + interval. Use for the signal history section. `interval` is optional.
```json
[
  {
    "id": 101,
    "pair": "BTC-EUR",
    "strategyName": "EMA_CROSSOVER",
    "signalType": "HOLD",
    "confidence": 50,
    "reason": "No crossover — EMA9=85200 EMA21=84900 RSI=52.1",
    "emaShort": 85200.00,
    "emaLong": 84900.00,
    "rsi": 52.10,
    "currentPrice": 85500.00,
    "createdAt": "2025-04-11T14:23:00"
  }
]
```

Signal type badge colours: `BUY` → green, `SELL` → red, `HOLD` → grey.

---

### GET /api/signals/summary?pair={pair}&interval={interval}
BUY/SELL/HOLD counts per strategy for the selected pair + interval. Use for the signal frequency chart on Overview. `interval` is optional.
```json
[
  { "strategy": "EMA_CROSSOVER", "signalType": "BUY",  "count": 14 },
  { "strategy": "EMA_CROSSOVER", "signalType": "SELL", "count": 8  },
  { "strategy": "EMA_CROSSOVER", "signalType": "HOLD", "count": 312 },
  { "strategy": "MACD",          "signalType": "BUY",  "count": 21 }
]
```

---

### POST /api/emergency-stop
Stops all strategies on all pairs. Body: none. Response: 200 plain text.

### POST /api/resume
Resumes after stop. Body: none. Response: 200 plain text.

### POST /api/config
Runtime config patch. All fields optional.
```json
{
  "maxPositionPct": 2.0,
  "maxConcurrentPositions": 3,
  "maxDailyLossPct": 5.0,
  "maxConsecutiveLosses": 5,
  "takeProfitPct": 5.0,
  "stopLossPct": 3.0,
  "emaShortPeriod": 9,
  "emaLongPeriod": 21,
  "rsiPeriod": 14,
  "rsiOverbought": 70,
  "rsiOversold": 30,
  "paperBalance": 10000.00
}
```

---

## State management

```ts
// Global UI state — lives in context (PairContext / FilterContext)
const [selectedPair, setSelectedPair] = useState<string>('BTC-EUR');
const [selectedInterval, setSelectedInterval] = useState<string>('15m');
const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | StrategyName>('overview');

// Pair and interval options fetched once on mount
const { data: pairs } = useQuery({ queryKey: ['pairs'], queryFn: fetchPairs, staleTime: Infinity });
const { data: intervals } = useQuery({ queryKey: ['intervals'], queryFn: fetchIntervals, staleTime: Infinity });
```

Every query key includes `selectedPair` AND `selectedInterval` so React Query re-fetches automatically when either changes:
```ts
useQuery({
  queryKey: ['strategies', selectedPair, selectedInterval],
  queryFn: () => fetchStrategies(selectedPair, selectedInterval),
  refetchInterval: 15000
})
```

---

## Polling intervals

| Endpoint | Interval | Notes |
|---|---|---|
| `/api/pairs` | once | Static config, no need to re-poll |
| `/api/intervals` | once | Static config, no need to re-poll |
| `/api/status` | 10s | Header — running state |
| `/api/strategies?pair=&interval=` | 15s | Overview cards |
| `/api/strategies/{name}/positions?pair=&interval=` | 15s | Live PnL |
| `/api/strategies/{name}/trades?pair=&interval=` | 30s | Updates on trade close |
| `/api/strategies/{name}/signals?pair=&interval=` | 30s | New signal every cycle |
| `/api/strategies/{name}/stats?pair=&interval=` | 60s | Slow moving |
| `/api/strategies/{name}/pnl?pair=&interval=` | 60s | Slow moving |
| `/api/signals/summary?pair=&interval=` | 60s | Signal frequency chart |
| `/api/signals/current` | 30s | Signals tab (matrix view) — fetched without params to get the full matrix |
| `/api/market/fear-greed` | 3600s | Cached hourly |

Use `refetchIntervalInBackground: false` — pause polling when the tab is hidden.

---

## Frontend architecture

```
src/
├── api/
│   ├── client.ts          # API client setup
│   ├── pairs.ts           # fetchPairs()
│   ├── intervals.ts       # fetchIntervals()
│   ├── status.ts          # fetchStatus()
│   ├── strategies.ts      # fetchStrategies(pair, interval), fetchStrategyStats(name, pair, interval), etc.
│   ├── signals.ts         # fetchSignalSummary(pair, interval), fetchStrategySignals(name, pair, interval)
│   └── fearGreed.ts       # fetchFearGreed()
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # pair dropdown + interval dropdown + bot status + stop/resume
│   │   └── StrategyNav.tsx     # Overview + Portfolio + scrollable strategy tabs (12 tabs)
│   ├── overview/
│   │   ├── StrategyCard.tsx              # one card per strategy
│   │   ├── CumulativePnlChart.tsx        # 12 lines with show/hide legend checkboxes
│   │   ├── SignalFrequencyChart.tsx       # grouped bar chart
│   │   ├── LeaderboardTable.tsx           # sortable strategy comparison table
│   │   └── IntervalComparisonChart.tsx    # cross-interval PnL comparison (NEW)
│   ├── strategy/
│   │   ├── StrategyHeader.tsx    # win rate, expectancy, daily PnL
│   │   ├── OpenPositions.tsx     # table + TP/SL progress bars
│   │   ├── TradesTable.tsx       # exit reason badges, colour by PnL
│   │   ├── PnlBreakdown.tsx      # day/week/month/all-time cards
│   │   ├── StrategyPnlChart.tsx  # single cumulative PnL line
│   │   └── SignalHistory.tsx     # recent signals with strategy-aware indicator columns
│   ├── portfolio/                # aggregated views across all strategies
│   └── config/
│       └── ConfigPanel.tsx       # form → POST /api/config
├── hooks/
│   ├── usePairs.ts
│   ├── useIntervals.ts           # interval options (staleTime: Infinity)
│   ├── useBotStatus.ts
│   ├── useStrategies.ts          # overview data — all 12 strategies
│   └── useStrategyDetail.ts      # all detail tab data for one strategy+pair+interval
├── utils/
│   ├── format.ts                 # EUR formatting, PnL colour, cumulative PnL
│   └── strategyMeta.ts           # indicator label mapping (see below)
├── pages/
│   ├── OverviewPage.tsx
│   ├── PortfolioPage.tsx
│   └── StrategyPage.tsx          # rendered for each of the 12 tabs
├── context/
│   └── PairContext.tsx            # selectedPair + selectedInterval state, wraps the whole app
└── App.tsx
```

All API functions accept `(pair, interval)` params. All React Query keys include both `selectedPair` and `selectedInterval`.

---

## `strategyMeta.ts` — indicator label helper

Each strategy repurposes the `emaShort`, `emaLong`, `rsi` fields differently. Use this helper so `SignalHistory` and `StrategyHeader` always show the right column names and values:

```ts
export type IndicatorMeta = {
  emaShortLabel: string | null   // null = don't display this field
  emaLongLabel:  string | null
  rsiLabel:      string | null
}

const META: Record<string, IndicatorMeta> = {
  EMA_CROSSOVER:  { emaShortLabel: 'EMA9',      emaLongLabel: 'EMA21',    rsiLabel: 'RSI' },
  MACD:           { emaShortLabel: 'MACD',       emaLongLabel: 'Signal',   rsiLabel: 'Histogram' },
  BOLLINGER:      { emaShortLabel: 'Upper Band', emaLongLabel: 'Lower Band', rsiLabel: '%B' },
  RSI_MOMENTUM:   { emaShortLabel: null,         emaLongLabel: null,       rsiLabel: 'RSI' },
  STOCH_RSI:      { emaShortLabel: 'StochRSI',   emaLongLabel: null,       rsiLabel: 'RSI' },
  TRIPLE_EMA:     { emaShortLabel: 'EMA5',       emaLongLabel: 'EMA34',    rsiLabel: 'EMA13' },
  PARABOLIC_SAR:  { emaShortLabel: 'SAR',        emaLongLabel: null,       rsiLabel: 'Price−SAR %' },
  ADX_DI:         { emaShortLabel: '+DI',        emaLongLabel: '−DI',      rsiLabel: 'ADX' },
  CCI:            { emaShortLabel: null,         emaLongLabel: null,       rsiLabel: 'CCI' },
  MFI:            { emaShortLabel: null,         emaLongLabel: null,       rsiLabel: 'MFI' },
  DONCHIAN:       { emaShortLabel: 'Upper Ch.',  emaLongLabel: 'Lower Ch.', rsiLabel: 'Width %' },
  ICHIMOKU:       { emaShortLabel: 'Tenkan',     emaLongLabel: 'Kijun',    rsiLabel: 'Span A' },
}

export function getIndicatorMeta(strategyName: string): IndicatorMeta {
  return META[strategyName] ?? { emaShortLabel: 'Ind1', emaLongLabel: 'Ind2', rsiLabel: 'Ind3' }
}
```

Use this in `SignalHistory` to render column headers and in `StrategyHeader` to label the indicator values displayed next to the current signal.

**Special display notes:**
- `ADX_DI`: highlight the `rsi` field (ADX value) in **bold** — it's the most important number; < 20 means "no trend", > 25 means "strong trend"
- `CCI`: the `rsi` field can be outside 0–100 (range is roughly −300 to +300). Don't clamp it. Show with a ± sign.
- `STOCH_RSI`: the `emaShort` field is already multiplied by 100 (0–100 scale). Display with no decimal places.
- `TRIPLE_EMA`: all three EMA values (emaShort=EMA5, rsi=EMA13, emaLong=EMA34) should be shown. The alignment direction (bullish/bearish/mixed) is more meaningful than the raw values.

---

## Cumulative PnL chart — how to compute

```ts
function toCumulativePnl(trades: Trade[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );
  let running = 0;
  return sorted
    .filter(t => t.pnl != null)
    .map(t => ({ date: t.executedAt, pnl: (running += t.pnl!) }));
}

// Overview: call for all 4 strategies, merge into one dataset for Recharts
// Each strategy becomes a <Line dataKey="pnl" /> with its own colour
```

---

## Display conventions

- **PnL**: always show sign and `€`. Green if > 0, red if < 0, grey if 0.
- **Win rate**: one decimal + `%` (e.g. `61.8%`)
- **BTC quantity**: 8 decimal places (`0.00235294`)
- **EUR amounts**: 2 decimal places with thousands separator (`€85,000.00`)
- **Expectancy**: label as `€5.32 per trade` — most important single number
- **Circuit breaker active**: red warning badge on strategy card and tab label. Never hide it.
- **Pair dropdown**: show `BTC/EUR` style (slash format) as the label, send `BTC-EUR` (hyphen) to API

---

## Phase 13 — Fee & Slippage Surfacing (Frontend)

**Goal:** Expose the net-after-fees picture that backend Phase 13 now produces — per-trade, per-strategy, and portfolio-wide. After this phase the user can answer at a glance:

1. **Am I actually growing the balance?** — Net P&L on every trade, stats card, chart, and portfolio summary.
2. **Which strategies are fee victims?** — `feeDragPct` and gross-vs-net side-by-side in the Leaderboard and Overview cards.
3. **What am I paying to trade?** — Total fees + slippage per strategy, broken down into entry/exit components on every closed trade row.

**Companion phase:** this work MUST ship in the same PR as backend Phase 13 because `/api/strategies/{name}/pnl` changes shape (breaking). All other additions are additive and safe to land incrementally.

> **Pre-read:** [`../revolut-trading-bot/CLAUDE.md`](../revolut-trading-bot/CLAUDE.md) → Phase 13 for the DTO shapes the backend is sending. The exact JSON is mirrored in `../API_CONTRACT.md` — that file is the source of truth.

---

### Current state (verified)

- API client is a single file: `src/api/client.ts` — `Trade`, `Position`, `Stats`, `TradeHistoryEntry` types defined here.
- Per-resource fetch functions in `src/api/strategies.ts`, `src/api/signals.ts`, `src/api/fearGreed.ts` (etc.).
- Data fetching: TanStack Query. Per-resource hooks under `src/hooks/` (`useStrategies`, `useStrategyDetail`, …). Pair/interval come from `PairContext` (`src/context/PairContext.tsx`).
- Formatting: `src/utils/format.ts` (`formatPnl`, `formatPct`, `formatPrice`, `formatQty`). Use these everywhere — do not introduce new ad-hoc formatters.
- Styling: Tailwind + CSS custom properties in `src/index.css`. Classes like `.badge`, `.card`, `.data-table`, `.value-lg`. **No Styled Components, no CSS modules.**
- Charts: Recharts. Existing P&L chart at `src/components/portfolio/PnlByStrategyChart.tsx`.
- Testing: none configured yet. Phase 13 does not introduce tests — note this as a known gap.

---

### Design decisions (locked)

- **Additive, not destructive.** `pnl` / `pnlPct` on `Trade` stay as **gross**. `netPnl` / `netPnlPct` are new fields. Existing UI labelled "Total PnL" etc. is now "Total Gross PnL" — add a sibling "Net PnL" line, don't swap.
- **Portfolio summary + Leaderboard headline number becomes NET.** If the user only reads one number, it's the honest one. Gross is shown secondary in smaller text.
- **Trade table: one new column "Net" (with entry+exit fee/slippage visible in the expanded row).** Do not spawn four new columns per row — that's noise.
- **Fee drag is a first-class metric.** It gets its own chip with a three-tier colour scale (green ≤ 25%, amber 25–75%, red > 75% or > 100% = fee victim).
- **One new page is NOT needed.** Fees integrate into existing Overview / Strategy Detail / Portfolio / History pages.
- **No new chart library.** Reuse Recharts. `PnlByStrategyChart` becomes a grouped bar chart (gross vs net).

---

### Step 1 — Types (`src/api/client.ts`)

Extend three existing types and add one new:

```ts
export type Trade = {
  id: number
  pair: string
  side: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice: number | null
  quantity: number
  pnl: number | null              // GROSS — semantics unchanged
  pnlPct: number | null
  // NEW — may be null for open trades
  netPnl: number | null
  netPnlPct: number | null
  entryFee: number
  exitFee: number
  entrySlippage: number
  exitSlippage: number
  exitReason: string | null
  strategyName: string
  tradingMode: 'PAPER' | 'LIVE'
  executedAt: string
  closedAt: string | null
}

export type Position = {
  id: number
  pair: string
  side: 'BUY' | 'SELL'
  entryPrice: number
  quantity: number
  takeProfit: number
  stopLoss: number
  currentPrice: number
  unrealisedPnl: number
  unrealisedPnlPct: number
  signalReason: string
  openedAt: string
  // NEW
  entryFee: number
  entrySlippage: number
}

export type Stats = {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: number                // GROSS — semantics unchanged
  averageWin: number
  averageLoss: number
  bestTrade: number
  worstTrade: number
  expectancy: number
  // NEW
  grossPnl: number                // alias of totalPnl for clarity
  netPnl: number
  totalFees: number
  totalSlippage: number
  feeDragPct: number              // 0..∞ — > 100 means net-negative despite gross-positive
  netExpectancy: number
}

export type FeeSummary = {
  totalFees: number
  totalSlippage: number
  avgFeePerTrade: number
  feePctOfNotional: number        // already multiplied by 100
  tradeCount: number
}

// PnlBreakdown is now { gross, net } per period (BREAKING change)
export type PnlPeriodValue = { gross: number; net: number }
export type PnlBreakdown = {
  daily: PnlPeriodValue
  weekly: PnlPeriodValue
  monthly: PnlPeriodValue
  allTime: PnlPeriodValue
}
```

Also extend `TradeHistoryEntry` (in `src/api/client.ts` around the existing definition) to include the same six new fields — the forensic history view needs them.

---

### Step 2 — API client functions (`src/api/strategies.ts`)

Add one function. Nothing else changes; the existing `fetchStrategyStats`, `fetchStrategyTrades`, `fetchStrategyPositions`, `fetchStrategyPnl` automatically return the extended DTOs because the types grow.

```ts
export function fetchStrategyFees(name: string, pair: string, interval: string): Promise<FeeSummary> {
  return request<FeeSummary>(
    `/api/strategies/${name}/fees?pair=${encodeURIComponent(pair)}&interval=${encodeURIComponent(interval)}`
  )
}
```

---

### Step 3 — Query hook (`src/hooks/useStrategyFees.ts`, new file)

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchStrategyFees } from '../api/strategies'
import { usePair } from '../context/PairContext'

export function useStrategyFees(strategyName: string) {
  const { selectedPair, selectedInterval } = usePair()
  return useQuery({
    queryKey: ['strategy-fees', strategyName, selectedPair, selectedInterval],
    queryFn:  () => fetchStrategyFees(strategyName, selectedPair, selectedInterval),
    refetchInterval: 60_000,                // fees change slowly
    refetchIntervalInBackground: false,
  })
}
```

Also add a parallel variant mirroring the existing `useAllStrategyStats` pattern in `src/hooks/useStrategies.ts`:

```ts
export function useAllStrategyFees(strategyNames: string[]) {
  // useQueries — one per strategy, same key shape as useStrategyFees
}
```

---

### Step 4 — Formatters (`src/utils/format.ts`)

Add three helpers. Do NOT inline formatting anywhere else.

```ts
/** Fees / slippage in EUR. Always shown as a cost, i.e. red when > 0, grey when 0. */
export function formatFee(eur: number): string {
  return eur === 0 ? '—' : `€${eur.toFixed(2)}`
}

/** Fee drag percentage. Rounded to one decimal. */
export function formatFeeDrag(pct: number): string {
  return `${pct.toFixed(1)}%`
}

/** Classifies fee drag into a colour tier. Used for CSS class suffix. */
export function feeDragTier(pct: number): 'low' | 'mid' | 'high' | 'victim' {
  if (pct > 100) return 'victim'
  if (pct > 75)  return 'high'
  if (pct > 25)  return 'mid'
  return 'low'
}
```

---

### Step 5 — CSS additions (`src/index.css`)

Append to the existing utility block:

```css
.fee-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.fee-chip.tier-low    { background: color-mix(in srgb, var(--green) 15%, transparent); color: var(--green); }
.fee-chip.tier-mid    { background: color-mix(in srgb, var(--amber) 18%, transparent); color: var(--amber); }
.fee-chip.tier-high   { background: color-mix(in srgb, var(--red)   18%, transparent); color: var(--red); }
.fee-chip.tier-victim { background: var(--red); color: white; }  /* stands out */

.pnl-pair { display: inline-flex; flex-direction: column; line-height: 1.1; }
.pnl-pair .net   { font-weight: 600; }
.pnl-pair .gross { font-size: 0.75rem; color: var(--text-secondary); }
```

`.pnl-pair` is reused wherever we stack Net (primary) over Gross (secondary).

---

### Step 6 — `StatsPanel.tsx` (`src/components/StatsPanel.tsx`)

Extend the existing grid. The current layout: Expectancy headline, Win Rate bar, Total PnL, Avg Win, Best, Worst (2×2), PnL Breakdown (4-col).

Changes:
- **"Total PnL" card** → rename to **"Net PnL"** (primary, large) with a "Gross: €X.XX" subtitle in the same card.
- **Expectancy headline** → show `netExpectancy` as the primary number, `expectancy` (gross) as the small subtitle.
- **Add a new card row beneath Best/Worst**: three tiles — **Total Fees** (`formatFee(totalFees)`), **Total Slippage** (`formatFee(totalSlippage)`), **Fee Drag** (`<span class="fee-chip tier-{feeDragTier(feeDragPct)}">{formatFeeDrag(feeDragPct)}</span>`).
- **PnL Breakdown section** → each period renders `<div class="pnl-pair"><span class="net">{formatPnl(v.net)}</span><span class="gross">gross {formatPnl(v.gross)}</span></div>`.

---

### Step 7 — `TradeHistoryTable.tsx` (`src/components/history/TradeHistoryTable.tsx`)

**Columns** — add one, keep layout tight:
- Existing columns stay: ID · Side · Opened · Closed · Duration · Entry · Exit · PnL · % · R-Mult · Reason · Mode.
- **PnL column** → renders `.pnl-pair` (Net primary, Gross small). Sort on `netPnl`.

**Expanded row** — add a "Costs" section alongside the existing detail block:

```
Costs:
  Entry fee: €0.18    Exit fee: €0.19
  Entry slippage: €0.16    Exit slippage: €0.17
  Total cost: €0.70    Net PnL: +€9.30    Gross PnL: +€10.00
```

Use `formatFee` and `formatPnl`. Colour the row background subtly red if `netPnl < 0 && pnl > 0` (fee-victim trade) — useful signal.

---

### Step 8 — `AllTradesTable.tsx` (`src/components/portfolio/AllTradesTable.tsx`)

Same column change as `TradeHistoryTable`: swap the PnL cell for `.pnl-pair`. No expandable row here — keep it compact. Sort by `netPnl` by default.

---

### Step 9 — `AllPositionsTable.tsx` + `OpenPositions.tsx`

Open positions don't have exit fees yet (they haven't paid them). Add only one inline piece of information so the user sees the "sunk" entry cost.

- **`src/components/portfolio/AllPositionsTable.tsx`** — new column **"Entry Cost"** = `formatFee(entryFee + entrySlippage)`. Tooltip on hover: "Fee €0.09 + slippage €0.08".
- **`src/components/strategy/OpenPositions.tsx`** — same column in the strategy-scoped table.

Leave the TP/SL progress bars untouched.

---

### Step 10 — `LeaderboardTable.tsx` (`src/components/overview/LeaderboardTable.tsx`)

Replace "Total PnL" column with `.pnl-pair` (Net primary, Gross small). Add two new columns:

- **Fee Drag** — `<span class="fee-chip tier-…">{formatFeeDrag(feeDragPct)}</span>`
- **Net Expectancy** — `formatPnl(netExpectancy)` + " / trade"

Highlight the top row per column as today — apply this to the new columns as well. Default sort becomes `netPnl DESC`.

---

### Step 11 — `StrategyCard.tsx` (`src/components/overview/StrategyCard.tsx`)

Each card shows a 2×2 mini-grid. Current tiles: Daily PnL · Open Pos · Win Rate · Consec Loss (+ circuit-breaker state).

Small change:
- **Daily PnL tile** → headline becomes **Net Daily PnL** using `.pnl-pair`; gross subtitle shown below. Backend sends `dailyPnl` on `/api/strategies` as gross for backward-compat — the card pulls the net figure from `useStrategyPnl(name).data?.daily.net` (already available via the hook, no new fetch needed).
- **Fee drag chip** — added as a small badge beneath the circuit-breaker chip so fee victims are visible at a glance on the grid.

No other layout changes.

---

### Step 12 — `PortfolioSummary.tsx` (`src/components/portfolio/PortfolioSummary.tsx`)

Headline bar currently shows All-Time PnL · Daily PnL · Unrealized · Open Positions · Win Rate. Modify:

- **All-Time PnL** and **Daily PnL** → `.pnl-pair` (net primary, gross secondary).
- **New tile** between "Unrealized" and "Open Positions": **Total Fees (all-time)**, summed across all strategies/pairs. Data source: sum `stats.totalFees + stats.totalSlippage` across all `(pair, strategy, interval)` combinations already fetched by `useAllStrategyStats`.

Keep the bar single-row — use tighter spacing if necessary.

---

### Step 13 — `PnlByStrategyChart.tsx` (`src/components/portfolio/PnlByStrategyChart.tsx`)

Currently a `<BarChart>` with one `<Bar dataKey="totalPnl">` per strategy.

Change to a grouped bar chart:

```tsx
<Bar dataKey="grossPnl" fill="var(--text-secondary)" name="Gross" />
<Bar dataKey="netPnl"   fill="var(--green)"          name="Net"   />
```

Bars with `netPnl < 0` should use `var(--red)` via a `<Cell>` conditional. Tooltip shows both values plus fee drag: "Gross €142.80 · Net €135.90 · Fee drag 4.8%".

Legend at the top with both keys.

---

### Step 14 — New component: `FeeBreakdownCard.tsx` (`src/components/strategy/FeeBreakdownCard.tsx`)

Small card for the Strategy Detail page — sits in the right column near `PnlBreakdown`. Shows the `/fees` endpoint output.

```
┌──────────────────────────────────────┐
│  Trading Costs                       │
├──────────────────────────────────────┤
│  Total fees:          €3.42          │
│  Total slippage:      €3.04          │
│  Avg per trade:       €0.19          │
│  Fees / notional:     0.17 %         │
│  Trades counted:      34             │
│  [FEE DRAG CHIP]                     │
└──────────────────────────────────────┘
```

Uses `useStrategyFees(strategyName)`. Skeleton state while loading.

Wire into `src/pages/StrategyPage.tsx` — add beneath `PnlBreakdown` in the right column.

---

### Step 15 — `History` page KPI strip (`src/pages/HistoryPage.tsx` or equivalent)

The KPI strip already has 8 cards including "Net PnL". Wire that card to the new `netPnl` value instead of computing it client-side from gross. Add a 9th chip: **Fee Drag** using the `.fee-chip tier-*` pattern.

---

### Step 16 — `API_CONTRACT.md` update (shared PR)

Done in the same PR as the backend changes (documented in backend Phase 13 Step 9). Do **not** duplicate contract definitions here — this CLAUDE.md references the contract, it doesn't own it.

---

### Explicit non-goals

- **No new top-level page.** Fees live inside existing Overview, Strategy Detail, Portfolio, and History pages.
- **No chart library swap.** Stick with Recharts.
- **No per-trade slippage chart.** A single grouped bar chart + expanded trade row is enough.
- **No retroactive audit log UI.** The backend's V7 backfill at a flat rate is documented in the backend CLAUDE.md; no UI surface needed.
- **No formatting library.** Use the existing `src/utils/format.ts` helpers.
- **No test harness bootstrap.** If Vitest is not configured, skip tests — add `// TODO: add tests once Vitest configured` notes on components with non-trivial logic (`feeDragTier`, the `.pnl-pair` component).
- **No changes to Phase 12 sentiment surfaces.**

---

### Verification checklist

1. **Type compile:** `tsc --noEmit` passes after extending `Trade`, `Position`, `Stats`, `PnlBreakdown`, `TradeHistoryEntry` and adding `FeeSummary`.
2. **`/fees` endpoint wired:** open any Strategy Detail page; `Network` tab shows `GET /api/strategies/{name}/fees?pair=&interval=` being polled every 60 s; `FeeBreakdownCard` renders real numbers.
3. **PnlBreakdown shape migration:** no `TypeError: v.toFixed is not a function` anywhere — every consumer of `/pnl` reads `.net` / `.gross`.
4. **Trade table:** PnL column shows Net on top, Gross (smaller, secondary) below. Expanded row shows all four fee/slippage values.
5. **Fee-victim row highlight:** find (or fabricate in dev) a trade where `pnl > 0 && netPnl < 0` — the row background tints red.
6. **Overview cards:** daily PnL headline uses net; gross shown secondary. Fee drag chip visible on at least one card after some trades close.
7. **Leaderboard:** default sort is `netPnl DESC`. `Fee Drag` and `Net Expectancy` columns present and sortable.
8. **Portfolio summary:** all-time PnL shows net (large) + gross (small). Total fees tile renders a number aggregated across strategies.
9. **Grouped bar chart:** `PnlByStrategyChart` shows two bars per strategy; net bars go red when `netPnl < 0`.
10. **Backward compatibility:** existing sentiment panel from Phase 12 unchanged; `/api/market/fear-greed` unaffected; all non-fee endpoints render identically.

---

### Implementation order (ship incrementally)

1. Types in `client.ts` + new `FeeSummary`.
2. `fetchStrategyFees` + `useStrategyFees` + `useAllStrategyFees`.
3. `format.ts` helpers + `index.css` additions.
4. `StatsPanel` (most consumers look here first).
5. `PortfolioSummary` + `LeaderboardTable` (headline numbers).
6. `TradeHistoryTable` + `AllTradesTable`.
7. `AllPositionsTable` + `OpenPositions` entry-cost column.
8. `StrategyCard` net daily + fee-drag chip.
9. `PnlByStrategyChart` grouped bars.
10. `FeeBreakdownCard` + slot into `StrategyPage`.
11. `HistoryPage` KPI strip tweak.
12. Smoke-test against a backend running with fees enabled.

Each step is isolated; commits can land one at a time. Step 1 and the `/pnl` shape change (Step 6 consumers) are the only parts that MUST ship together with the backend PR.

---

### Milestone

Every P&L number a user sees on the dashboard is now the honest one: post-fee, post-slippage. Gross is still visible as context, but net leads. Fee-victim strategies are flagged on the Leaderboard, on the Overview cards, and with tinted rows in the trade table. Opening the Strategy Detail page shows exactly how many euros each strategy is paying Revolut — so when the user widens position sizing or tunes TP/SL, they can see in real time whether the edge survives the costs.
