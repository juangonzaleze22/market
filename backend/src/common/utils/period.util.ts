export type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface ResolvedPeriod {
  period: DashboardPeriod;
  from: Date | null;
  to: Date;
}

const PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year', 'all'];

export function normalizePeriod(value?: string): DashboardPeriod {
  return PERIODS.includes(value as DashboardPeriod)
    ? (value as DashboardPeriod)
    : 'month';
}

export function resolvePeriod(value?: string, now = new Date()): ResolvedPeriod {
  const period = normalizePeriod(value);
  const to = new Date(now);
  const from = new Date(now);

  from.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      break;
    case 'week': {
      const day = from.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setDate(from.getDate() - diff);
      break;
    }
    case 'month':
      from.setDate(1);
      break;
    case 'year':
      from.setMonth(0, 1);
      break;
    case 'all':
      return { period, from: null, to };
  }

  return { period, from, to };
}

export function toDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
