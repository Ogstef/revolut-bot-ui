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
  { "minutes": 15, "label": "15m", "displayName": "15 min" },
  { "minutes": 60, "label": "1h",  "displayName": "1 hour" }
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

Three top-level views:
- **Overview** — all 12 strategies for the selected pair + interval, side by side, plus a cross-interval comparison section
- **Portfolio** — aggregated view across all strategies (optionally across all intervals)
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
  { "minutes": 15, "label": "15m", "displayName": "15 min" },
  { "minutes": 60, "label": "1h",  "displayName": "1 hour" }
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
