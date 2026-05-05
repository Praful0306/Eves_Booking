import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const EVENT_TYPE_ICONS: Record<string, string> = {
  TRAIN: '🚂',
  BUS: '🚌',
  CINEMA: '🎬',
  EVENT: '🎪',
  STADIUM: '🏟️',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  TRAIN: 'Train',
  BUS: 'Bus',
  CINEMA: 'Cinema',
  EVENT: 'Event',
  STADIUM: 'Stadium',
};
