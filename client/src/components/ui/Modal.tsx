import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  overline?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, subtitle, overline, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full max-w-2xl glass rounded-lg shadow-float border border-surface_bright/30',
        className
      )}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          {overline && <p className="overline mb-1">{overline}</p>}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-headline-sm text-on_surface">{title}</h2>
              {subtitle && <p className="text-body-md text-on_surface_variant mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-on_surface_variant hover:text-on_surface transition-colors mt-0.5">
              <X size={18} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
