import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

export function sentimentColor(s: string) {
  return s === 'POSITIVE' ? 'text-secondary' : s === 'NEGATIVE' ? 'text-error' : 'text-tertiary';
}

export function sentimentBg(s: string) {
  return s === 'POSITIVE' ? 'bg-secondary/10 text-secondary'
       : s === 'NEGATIVE' ? 'bg-error/10 text-error'
       : 'bg-tertiary/10 text-tertiary';
}
