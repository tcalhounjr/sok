import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'neutral' | 'active' | 'archived' | 'draft';
  className?: string;
}

const variants: Record<string, string> = {
  default:  'bg-surface_variant text-on_surface_variant',
  positive: 'bg-secondary/10 text-secondary',
  negative: 'bg-error/10 text-error',
  neutral:  'bg-tertiary/10 text-tertiary',
  active:   'bg-secondary/10 text-secondary',
  archived: 'bg-surface_variant text-on_surface_variant',
  draft:    'bg-tertiary/10 text-tertiary',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-sm text-label-sm uppercase tracking-widest font-body',
      variants[variant], className
    )}>
      {children}
    </span>
  );
}
