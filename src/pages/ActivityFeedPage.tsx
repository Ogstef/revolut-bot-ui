import { useMemo, useState } from 'react';
import type { BotEventType } from '../api/client';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { formatDateTime } from '../utils/format';

interface Props {
  onSelectStrategy?: (name: string) => void;
}

type Category = 'ALL' | 'POSITIONS' | 'RISK' | 'SYSTEM';

const CATEGORY_TYPES: Record<Exclude<Category, 'ALL'>, BotEventType[]> = {
  POSITIONS: ['POSITION_OPENED', 'POSITION_CLOSED'],
  RISK: ['CIRCUIT_BREAKER_TRIPPED', 'CIRCUIT_BREAKER_RESET'],
  SYSTEM: ['BOT_STOPPED', 'BOT_RESUMED', 'CONFIG_CHANGED'],
};

const CATEGORY_LABEL: Record<Category, string> = {
  ALL: 'All',
  POSITIONS: 'Positions',
  RISK: 'Risk',
  SYSTEM: 'System',
};

const ICON_BY_TYPE: Record<BotEventType, string> = {
  POSITION_OPENED: '\u25CF',
  POSITION_CLOSED: '\u25CC',
  CIRCUIT_BREAKER_TRIPPED: '\u26A0',
  CIRCUIT_BREAKER_RESET: '\u2713',
  BOT_STOPPED: '\u25A0',
  BOT_RESUMED: '\u25B6',
  CONFIG_CHANGED: '\u2699',
};

export default function ActivityFeedPage({ onSelectStrategy }: Props) {
  const [category, setCategory] = useState<Category>('ALL');

  const types = useMemo<BotEventType[] | undefined>(() => {
    return category === 'ALL' ? undefined : CATEGORY_TYPES[category];
  }, [category]);

  const feedQ = useActivityFeed(100, types);
  const events = feedQ.data ?? [];

  const handleChipClick = (cat: Category) => {
    setCategory(prev => (prev === cat ? 'ALL' : cat));
  };

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="label" style={{ margin: 0 }}>Activity Feed</div>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse-dot-green 2s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Bot lifecycle events — newest first.
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {events.length} {events.length === 1 ? 'event' : 'events'} · refreshes every 15s
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(Object.keys(CATEGORY_LABEL) as Category[]).map(cat => {
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => handleChipClick(cat)}
              className="badge"
              style={{
                cursor: 'pointer',
                background: isActive ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: isActive ? 'var(--bg-base)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                padding: '4px 10px',
                fontSize: 10,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          );
        })}
      </div>

      {feedQ.isLoading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
          Loading activity feed…
        </div>
      ) : feedQ.isError ? (
        <div style={{ padding: 40, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
          Failed to load activity feed — is the backend reachable?
        </div>
      ) : events.length === 0 ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
          No events yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {events.map(event => {
            const hasTriple = Boolean(event.pair || event.strategy || event.interval);
            const tripleParts = [event.pair, event.strategy, event.interval].filter(Boolean) as string[];
            const canNavigate = Boolean(event.strategy) && Boolean(onSelectStrategy);

            return (
              <div
                key={event.id}
                className={`activity-row severity-${event.severity.toLowerCase()}`}
              >
                <span className="ts">{formatDateTime(event.createdAt)}</span>
                <span className="icon">{ICON_BY_TYPE[event.type]}</span>
                <div>
                  <div className="title">{event.title}</div>
                  {event.detail && <div className="detail">{event.detail}</div>}
                </div>
                {hasTriple ? (
                  <button
                    className="triple-chip"
                    onClick={() => {
                      if (canNavigate && event.strategy) {
                        onSelectStrategy!(event.strategy);
                      }
                    }}
                    style={{
                      cursor: canNavigate ? 'pointer' : 'default',
                      fontFamily: 'var(--font-mono)',
                    }}
                    disabled={!canNavigate}
                    title={canNavigate ? `Open ${event.strategy} detail tab` : undefined}
                  >
                    {tripleParts.join(' · ')}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
