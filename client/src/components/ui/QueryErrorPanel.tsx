import { AlertTriangle } from 'lucide-react';

interface QueryErrorPanelProps {
  message: string;
  onRetry: () => void;
}

export function QueryErrorPanel({ message, onRetry }: QueryErrorPanelProps) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-48">
      <div
        role="alert"
        className="bg-surface_container rounded-sm p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center"
      >
        <AlertTriangle size={16} className="text-tertiary flex-shrink-0" />
        <p className="text-body-sm text-on_surface_variant font-body">{message}</p>
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try again
        </button>
      </div>
    </div>
  );
}
