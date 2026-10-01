import type { ProducaoOP, PumpCapacity, CurrentUser } from './types';

export const PUMP_CAPACITIES: PumpCapacity[] = [
  { bomba: 'Bomba A', capacidade_ideal: 12 },
  { bomba: 'Bomba B', capacidade_ideal: 15 },
];

export const CURRENT_USER: CurrentUser = {
  name: 'Ana Costa',
  role: 'Gerente',
};

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
