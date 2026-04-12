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
};

export function getIndicatorMeta(strategyName: string): IndicatorMeta {
  return META[strategyName] ?? { emaShortLabel: 'Ind1', emaLongLabel: 'Ind2', rsiLabel: 'Ind3' };
}

// Distinct colours for up to 9 strategy lines on the chart
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
};

export function strategyColor(name: string): string {
  return STRATEGY_COLORS[name] ?? '#7a8fa6';
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
];
