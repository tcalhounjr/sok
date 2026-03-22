import { cn } from '../../lib/utils';

interface StatusDotProps {
  status: 'active' | 'live' | 'archived' | 'draft' | 'critical';
  pulse?: boolean;
  className?: string;
}

const colors: Record<string, string> = {
  active:   'bg-secondary',
  live:     'bg-secondary',
  archived: 'bg-surface_variant',
  draft:    'bg-tertiary',
  critical: 'bg-error',
};

export function StatusDot({ status, pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn(
      'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
      colors[status] ?? 'bg-surface_variant',
      pulse && 'pulse-dot',
      className
    )} />
  );
}
