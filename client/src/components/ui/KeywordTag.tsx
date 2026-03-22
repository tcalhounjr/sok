import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KeywordTagProps {
  label: string;
  onRemove?: () => void;
  className?: string;
  mono?: boolean;
}

export function KeywordTag({ label, onRemove, className, mono = true }: KeywordTagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-surface_container_high ghost-border',
      mono ? 'font-mono text-label-sm text-secondary' : 'font-body text-label-md text-on_surface',
      className
    )}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="text-on_surface_variant hover:text-error transition-colors">
          <X size={10} />
        </button>
      )}
    </span>
  );
}
