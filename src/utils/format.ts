export function formatPnl(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}€${Math.abs(val).toFixed(2)}`;
}

export function formatAxisPnl(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val < 0 ? '-' : '';
  return `${sign}€${Math.round(Math.abs(val))}`;
}

export function formatPct(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatPrice(val: number | null | undefined): string {
  if (val == null) return '—';
  return `€${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQty(val: number | null | undefined): string {
  if (val == null) return '—';
  return val.toFixed(8);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}
