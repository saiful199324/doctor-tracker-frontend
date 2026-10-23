import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { Condition } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (iso: string, pattern = 'd MMM yyyy') => format(parseISO(iso), pattern);
export const timeAgo = (iso: string) => formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
export const toDateInput = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
export const today = () => format(new Date(), 'yyyy-MM-dd');

const numberFormat = new Intl.NumberFormat('en-US');
export const formatNumber = (n: number) => numberFormat.format(n);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export const CONDITION_META: Record<Condition, { label: string; color: string }> = {
  stable: { label: 'Stable', color: 'var(--condition-stable)' },
  critical: { label: 'Critical', color: 'var(--condition-critical)' },
  recovering: { label: 'Recovering', color: 'var(--condition-recovering)' },
  observation: { label: 'Observation', color: 'var(--condition-observation)' },
  discharged: { label: 'Discharged', color: 'var(--condition-discharged)' },
};

/** Stable hue per name, used for avatar backgrounds. */
export function avatarHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}
