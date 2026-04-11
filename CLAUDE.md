# Revolut Trading Bot — Frontend

## Overview

React/TypeScript dashboard for the Revolut Trading Bot Spring Boot backend.
The backend runs on `http://localhost:8089`. All data comes from it — this UI never calls Revolut directly.

**The bot runs 4 strategies × N pairs simultaneously — each combination is an independent virtual portfolio.**
The UI lets you pick a pair from a dropdown, then browse each strategy's performance in its own tab.

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

4 strategies. These are the exact string values used as path params in `/api/strategies/{name}`:

| Path param | Display name | Logic |
|---|---|---|
| `EMA_CROSSOVER` | EMA Crossover | EMA(9) crosses EMA(21) + RSI filter |
| `MACD` | MACD | MACD histogram crosses zero |
| `BOLLINGER` | Bollinger Bands | Price bounces off upper/lower bands |
| `RSI_MOMENTUM` | RSI Momentum | RSI crosses 30 (oversold) or 70 (overbought) |

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

## Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  NAV: [Overview] [EMA Crossover] [MACD] [Bollinger] [RSI Momentum]  │
│       Pair: [BTC-EUR ▼]                  ● RUNNING  [STOP][RESUME]  │
└──────────────────────────────────────────────────────────────────────┘
```

The **pair dropdown** lives in the header, always visible. Changing the pair re-fetches all data on the current tab. Store selected pair in React state (or URL query param so it's bookmarkable).

Two top-level views:
- **Overview** — all 4 strategies for the selected pair, side by side
- **Strategy tabs** — one tab per strategy, scoped to the selected pair

---

## Page 1 — Overview (default landing)

Compares all 4 strategies for the currently selected pair.

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER — BTC-EUR | PAPER | ● RUNNING | [STOP] [RESUME]         │
│  Pair: [BTC-EUR ▼]  Daily PnL (all): -€12.50 | CBs active: 0/4 │
├──────────────┬───────────────┬──────────────┬───────────────────┤
│ EMA CROSSOVER│     MACD      │  BOLLINGER   │   RSI MOMENTUM    │
│ Daily: +€8.2 │ Daily: -€4.1  │ Daily: +€2.0 │ Daily: -€18.6    │
│ Open: 1 pos  │ Open: 0 pos   │ Open: 2 pos  │ Open: 0 pos       │
│ Win rate: 63%│ Win rate: 58% │ Win rate: 55%│ Win rate: 40%     │
│ ● OK         │ ● OK          │ ● OK         │ ⚠ CIRCUIT BREAK   │
├──────────────┴───────────────┴──────────────┴───────────────────┤
│  CUMULATIVE PNL CHART — 4 lines, one per strategy                │
│  X axis: time  Y axis: €  Toggle: All time | Monthly | Weekly   │
│  Computed from trade history (running sum of pnl by executedAt) │
├──────────────────────────────────────────────────────────────────┤
│  SIGNAL FREQUENCY — grouped bar chart                            │
│  X axis: strategy  Y axis: count  Groups: BUY / SELL / HOLD     │
│  Source: GET /api/signals/summary?pair={pair}                   │
└──────────────────────────────────────────────────────────────────┘
```

**Data sources:**
- Strategy cards: `GET /api/strategies?pair={pair}` (poll 15s)
- Cumulative PnL chart: `GET /api/strategies/{name}/trades?pair={pair}&limit=500` for all 4, compute running sum on frontend
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

### GET /api/strategies?pair={pair}
All 4 strategies with their current snapshot for the selected pair. Use for Overview cards.
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

### GET /api/strategies/{name}/positions?pair={pair}
Open positions for one strategy + pair with live unrealised PnL.
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

### GET /api/strategies/{name}/trades?pair={pair}&limit=50
Closed trades for one strategy + pair.
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

### GET /api/strategies/{name}/stats?pair={pair}
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

### GET /api/strategies/{name}/pnl?pair={pair}
```json
{
  "daily": 8.20,
  "weekly": 38.20,
  "monthly": 142.80,
  "allTime": 142.80
}
```

---

### GET /api/strategies/{name}/signals?pair={pair}&limit=20
Recent signal evaluations for one strategy + pair. Use for the signal history section.
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

### GET /api/signals/summary?pair={pair}
BUY/SELL/HOLD counts per strategy for the selected pair. Use for the signal frequency chart on Overview.
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
// Global UI state — lives in App.tsx or a context
const [selectedPair, setSelectedPair] = useState<string>('BTC-EUR');
const [activeTab, setActiveTab] = useState<'overview' | StrategyName>('overview');

// Pair options fetched once on mount
const { data: pairs } = useQuery({ queryKey: ['pairs'], queryFn: fetchPairs, staleTime: Infinity });
```

Every query key includes `selectedPair` so React Query re-fetches automatically when the pair changes:
```ts
useQuery({ queryKey: ['strategies', selectedPair], queryFn: () => fetchStrategies(selectedPair), refetchInterval: 15000 })
```

---

## Polling intervals

| Endpoint | Interval | Notes |
|---|---|---|
| `/api/pairs` | once | Static config, no need to re-poll |
| `/api/status` | 10s | Header — running state |
| `/api/strategies?pair=` | 15s | Overview cards |
| `/api/strategies/{name}/positions?pair=` | 15s | Live PnL |
| `/api/strategies/{name}/trades?pair=` | 30s | Updates on trade close |
| `/api/strategies/{name}/signals?pair=` | 30s | New signal every cycle |
| `/api/strategies/{name}/stats?pair=` | 60s | Slow moving |
| `/api/strategies/{name}/pnl?pair=` | 60s | Slow moving |
| `/api/signals/summary?pair=` | 60s | Signal frequency chart |

Use `refetchIntervalInBackground: false` — pause polling when the tab is hidden.

---

## Frontend architecture

```
src/
├── api/
│   ├── pairs.ts           # fetchPairs()
│   ├── status.ts          # fetchStatus()
│   ├── strategies.ts      # fetchStrategies(pair), fetchStrategyStats(name, pair), etc.
│   └── signals.ts         # fetchSignalSummary(pair), fetchStrategySignals(name, pair)
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # pair dropdown + bot status + stop/resume
│   │   └── StrategyNav.tsx     # Overview + 4 strategy tabs
│   ├── overview/
│   │   ├── StrategyCard.tsx         # one card per strategy
│   │   ├── CumulativePnlChart.tsx   # 4 lines from trade history
│   │   └── SignalFrequencyChart.tsx # grouped bar chart
│   ├── strategy/
│   │   ├── StrategyHeader.tsx    # win rate, expectancy, daily PnL
│   │   ├── OpenPositions.tsx     # table + TP/SL progress bars
│   │   ├── TradesTable.tsx       # exit reason badges, colour by PnL
│   │   ├── PnlBreakdown.tsx      # day/week/month/all-time cards
│   │   ├── StrategyPnlChart.tsx  # single line cumulative PnL
│   │   └── SignalHistory.tsx     # recent signals table
│   └── config/
│       └── ConfigPanel.tsx       # form → POST /api/config
├── hooks/
│   ├── usePairs.ts
│   ├── useBotStatus.ts
│   ├── useStrategies.ts          # overview data
│   └── useStrategyDetail.ts      # all detail tab data for one strategy+pair
├── pages/
│   ├── OverviewPage.tsx
│   └── StrategyPage.tsx          # rendered for each of the 4 tabs
├── context/
│   └── PairContext.tsx            # selectedPair state + setter, wraps the whole app
└── App.tsx
```

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
