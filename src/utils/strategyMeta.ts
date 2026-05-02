export interface IndicatorMeta {
  emaShortLabel: string | null;
  emaLongLabel:  string | null;
  rsiLabel:      string | null;
}

const META: Record<string, IndicatorMeta> = {
  EMA_CROSSOVER:  { emaShortLabel: 'EMA9',       emaLongLabel: 'EMA21',      rsiLabel: 'RSI'        },
  MACD:           { emaShortLabel: 'MACD',        emaLongLabel: 'Signal',     rsiLabel: 'Histogram'  },
  BOLLINGER:      { emaShortLabel: 'Upper Band',  emaLongLabel: 'Lower Band', rsiLabel: '%B'         },
  RSI_MOMENTUM:   { emaShortLabel: null,          emaLongLabel: null,         rsiLabel: 'RSI'        },
  STOCH_RSI:      { emaShortLabel: 'StochRSI',    emaLongLabel: null,         rsiLabel: 'RSI'        },
  TRIPLE_EMA:     { emaShortLabel: 'EMA5',        emaLongLabel: 'EMA34',      rsiLabel: 'EMA13'      },
  PARABOLIC_SAR:  { emaShortLabel: 'SAR',         emaLongLabel: null,         rsiLabel: 'Price−SAR %'},
  ADX_DI:         { emaShortLabel: '+DI',         emaLongLabel: '−DI',        rsiLabel: 'ADX'        },
  CCI:            { emaShortLabel: null,          emaLongLabel: null,         rsiLabel: 'CCI'        },
  MFI:            { emaShortLabel: null,          emaLongLabel: null,         rsiLabel: 'MFI'        },
  DONCHIAN:       { emaShortLabel: 'Upper',       emaLongLabel: 'Lower',      rsiLabel: 'Width %'    },
  ICHIMOKU:       { emaShortLabel: 'Tenkan',      emaLongLabel: 'Kijun',      rsiLabel: 'Span A'     },
  SUPERTREND:     { emaShortLabel: 'Supertrend',  emaLongLabel: 'ATR',        rsiLabel: 'Distance %' },
  REDDIT_SENTIMENT:     { emaShortLabel: 'Score',   emaLongLabel: 'Volume',  rsiLabel: 'n Posts'    },
  CRYPTOPANIC_SENTIMENT:{ emaShortLabel: 'Score',   emaLongLabel: 'Volume',  rsiLabel: 'n Posts'    },
  COMBINED_SENTIMENT:   { emaShortLabel: 'Score',   emaLongLabel: 'Volume',  rsiLabel: 'Disagree?'  },
  MARKET_CONTEXT:       { emaShortLabel: 'F&G',     emaLongLabel: 'Bid/Ask', rsiLabel: null         },
};

export function getIndicatorMeta(strategyName: string): IndicatorMeta {
  return META[strategyName] ?? { emaShortLabel: 'Ind1', emaLongLabel: 'Ind2', rsiLabel: 'Ind3' };
}

// Distinct colours for up to 12 strategy lines on the chart
export const STRATEGY_COLORS: Record<string, string> = {
  EMA_CROSSOVER:  '#00e676',
  MACD:           '#4fc3f7',
  BOLLINGER:      '#ffb800',
  RSI_MOMENTUM:   '#ff7043',
  STOCH_RSI:      '#ce93d8',
  TRIPLE_EMA:     '#80cbc4',
  PARABOLIC_SAR:  '#f48fb1',
  ADX_DI:         '#fff176',
  CCI:            '#ef5350',
  MFI:            '#a5d6a7',
  DONCHIAN:       '#90caf9',
  ICHIMOKU:       '#ffcc80',
  SUPERTREND:     '#26c6da',
  REDDIT_SENTIMENT:     '#ff4500',   // Reddit orange
  CRYPTOPANIC_SENTIMENT:'#b39ddb',
  COMBINED_SENTIMENT:   '#e0f7fa',
  MARKET_CONTEXT:       '#9c27b0',   // distinct violet — macro context line
};

export function strategyColor(name: string): string {
  return STRATEGY_COLORS[name] ?? '#7a8fa6';
}

// Distinct colours per interval, used by the Cross-Interval tab.
export const INTERVAL_COLORS: Record<string, string> = {
  '15m': '#00e676',
  '1h':  '#4fc3f7',
  '4h':  '#ffb800',
  '1d':  '#ff7043',
  '1w':  '#ce93d8',
};

export function intervalColor(label: string): string {
  return INTERVAL_COLORS[label] ?? '#7a8fa6';
}

// Fallback list used for nav rendering before API data loads
export const KNOWN_STRATEGIES: { name: string; displayName: string }[] = [
  { name: 'EMA_CROSSOVER',  displayName: 'EMA Crossover'   },
  { name: 'MACD',           displayName: 'MACD'            },
  { name: 'BOLLINGER',      displayName: 'Bollinger'       },
  { name: 'RSI_MOMENTUM',   displayName: 'RSI Momentum'    },
  { name: 'STOCH_RSI',      displayName: 'Stoch RSI'       },
  { name: 'TRIPLE_EMA',     displayName: 'Triple EMA'      },
  { name: 'PARABOLIC_SAR',  displayName: 'Parabolic SAR'   },
  { name: 'ADX_DI',         displayName: 'ADX + DI'        },
  { name: 'CCI',            displayName: 'CCI'             },
  { name: 'MFI',            displayName: 'Money Flow'      },
  { name: 'DONCHIAN',       displayName: 'Donchian'        },
  { name: 'ICHIMOKU',       displayName: 'Ichimoku'        },
  { name: 'SUPERTREND',     displayName: 'Supertrend'      },
  { name: 'REDDIT_SENTIMENT',     displayName: 'Reddit Sentiment'      },
  { name: 'CRYPTOPANIC_SENTIMENT',displayName: 'CryptoPanic Sentiment' },
  { name: 'COMBINED_SENTIMENT',   displayName: 'Combined Sentiment'    },
  { name: 'MARKET_CONTEXT',       displayName: 'Market Context'        },
];
