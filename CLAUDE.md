# Revolut Trading Bot — Frontend

## Overview

React/TypeScript dashboard for the Revolut Trading Bot Spring Boot backend.
The backend runs on `http://localhost:8089`. All data comes from it — this UI never calls Revolut directly.

## Tech Stack (recommended, adjust if you prefer something else)

- **React 19 + TypeScript**
- **Vite** — dev server + build
- **TanStack Query (React Query)** — data fetching, caching, polling
- **Recharts** — PnL charts, signal history
- **Tailwind CSS** — styling
- **shadcn/ui** — component library built on Radix UI

Bootstrap command:
```bash
npm create vite@latest . -- --template react-ts
npm install @tanstack/react-query recharts tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

---

## Backend API Contract

Base URL: `http://localhost:8089`

All responses are JSON. No authentication required (local only).

---

### GET /api/status

Bot health snapshot. Poll every 10–30 seconds on the dashboard header.

**Response:**
```json
{
  "running": true,
  "mode": "PAPER",
  "pair": "BTC-EUR",
  "openPositions": 1,
  "dailyPnl": -12.50,
  "consecutiveLosses": 2,
  "circuitBreakerOn": false,
  "reportedAt": "2025-04-10T14:23:01.123Z"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `running` | boolean | false = emergency stop engaged |
| `mode` | string | "PAPER" or "LIVE" |
| `circuitBreakerOn` | boolean | true = daily loss OR consecutive loss limit breached |

---

### GET /api/positions

Open positions with live unrealised PnL at the current market price.

**Response:** array of:
```json
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
  "signalReason": "EMA crossover bullish | RSI neutral at 52.3",
  "openedAt": "2025-04-10T12:00:00"
}
```

---

### GET /api/trades?limit=50

Recent closed trades (default 50).

**Response:** array of:
```json
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
  "tradingMode": "PAPER",
  "executedAt": "2025-04-09T18:45:00"
}
```

`exitReason` values: `TP_HIT`, `SL_HIT`, `SIGNAL_EXIT`, `MANUAL`

---

### GET /api/stats

Aggregate performance statistics across all closed trades.

**Response:**
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

`expectancy` = average EUR per trade (positive = profitable strategy).

---

### GET /api/pnl

PnL broken down by time period.

**Response:**
```json
{
  "daily": -12.50,
  "weekly": 38.20,
  "monthly": 142.80,
  "allTime": 142.80
}
```

---

### POST /api/emergency-stop

Stops the bot. Open positions are **not** automatically closed.

**Body:** none

**Response:** `200 OK` with plain text message.

---

### POST /api/resume

Resumes the bot after an emergency stop.

**Body:** none

**Response:** `200 OK` with plain text message.

---

### POST /api/config

Updates trading parameters at runtime. **All fields are optional** — omit fields you don't want to change.

**Body:**
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

**Response:** `200 OK` with plain text confirmation.
Changes take effect on the **next trading cycle** (within 30 seconds).

---

### Test/debug endpoints (useful during development)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/test/health` | App up + signing key loaded |
| GET | `/test/auth/balance` | Live Revolut account balances |
| GET | `/test/auth/ticker?symbol=BTC-EUR` | Current BTC-EUR bid/ask/mid |
| GET | `/test/signals/current` | Latest signal (fetches fresh candles) |
| GET | `/test/signals/history?limit=20` | Recent signal log rows |
| GET | `/test/risk/status?balance=10000` | Risk metrics at a given balance |
| GET | `/test/paper/positions` | Open positions (raw entity) |
| GET | `/test/paper/trades?limit=20` | Recent trades (raw entity) |
| GET | `/test/portfolio/snapshot` | Portfolio snapshot with unrealised PnL |
| GET | `/test/portfolio/stats` | Same as /api/stats |

---

## Suggested UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: BTC-EUR | PAPER mode | ● RUNNING  [STOP] [RESUME]  │
│          Daily PnL: +€38.20 | Circuit Breaker: OFF          │
├───────────────┬─────────────────────────────────────────────┤
│  OPEN         │  PNL CHART (line chart, daily/weekly/monthly │
│  POSITIONS    │  toggle)                                     │
│  (table with  │                                              │
│  live PnL,    │                                              │
│  TP/SL bars)  │                                              │
├───────────────┼─────────────────────────────────────────────┤
│  STATS        │  RECENT TRADES (table: pair, side, pnl,     │
│  Win rate: 62%│  exit reason, date)                         │
│  Expectancy   │                                              │
│  Best/worst   │                                              │
├───────────────┴─────────────────────────────────────────────┤
│  CONFIG PANEL: sliders/inputs for risk + strategy params    │
│  [Save Config] button → POST /api/config                    │
└─────────────────────────────────────────────────────────────┘
```

## Polling Strategy

| Endpoint | Refresh interval | Why |
|----------|-----------------|-----|
| `/api/status` | 10s | Circuit breaker, running state |
| `/api/positions` | 15s | Live PnL changes with price |
| `/api/pnl` | 60s | PnL changes on trade close only |
| `/api/trades` | 30s | New trade closes |
| `/api/stats` | 60s | Aggregate — rarely changes |

Use TanStack Query `refetchInterval` for all of these.

## CORS

The Spring Boot backend needs CORS configured for `http://localhost:5173` (Vite default).
If you get CORS errors, add this to the backend:

```java
// In a @Configuration class:
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                    .allowedOrigins("http://localhost:5173")
                    .allowedMethods("GET", "POST", "PUT", "DELETE");
        }
    };
}
```

## Key numbers to display

- **PnL**: always show sign (+/−) and € symbol. Green if positive, red if negative.
- **Win rate**: percentage with one decimal (e.g. 61.8%)
- **Prices**: 2 decimal places for EUR amounts, 8 for BTC quantities
- **Expectancy**: "€5.32 per trade" — the most important single number for strategy health
