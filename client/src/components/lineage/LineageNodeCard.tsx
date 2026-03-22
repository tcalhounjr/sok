import { StatusDot } from '../ui/StatusDot';
import { LineageNode } from '../../types';

interface LineageNodeCardProps {
  node: LineageNode;
  depth: number;
  indexInRow: number;
  isSelected: boolean;
  onSelect: (node: LineageNode) => void;
  showTopConnector: boolean;
  showBottomConnector: boolean;
}

export function LineageNodeCard({
  node, depth, indexInRow, isSelected, onSelect,
  showTopConnector, showBottomConnector,
}: LineageNodeCardProps) {
  return (
    <div className="relative">
      {showTopConnector && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-surface_bright" />
      )}
      <button
        onClick={() => onSelect(node)}
        className={`w-72 p-4 rounded-sm text-left transition-colors ${
          isSelected
            ? 'bg-surface_container_high ghost-border border-primary/40'
            : 'card hover:bg-surface_container_high ghost-border'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="mono-id">UUID: {node.search.id.slice(0, 8)}</span>
          <StatusDot
            status={node.search.status as any}
            pulse={node.search.status === 'active'}
          />
        </div>
        <h3 className="font-display font-semibold text-on_surface text-sm mb-2 leading-snug">
          {node.search.name}
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {node.search.keywords?.slice(0, 3).map((kw: string, i: number, arr: string[]) => (
            <span key={kw} className="text-label-sm text-on_surface_variant font-body">
              {kw}{i < Math.min(2, arr.length - 1) ? ',' : ''}
            </span>
          ))}
        </div>
        <div className="space-y-0.5">
          {node.isRoot && (
            <p className="text-label-sm text-on_surface_variant font-body italic">Root Search</p>
          )}
          {(node.search.parents?.length ?? 0) > 0 && (
            <p className="text-label-sm text-on_surface_variant font-body">
              Parent: {node.search.parents![0].name.split(' ').slice(0, 2).join(' ')}
            </p>
          )}
          {depth > 0 && (
            <p className="text-label-sm text-secondary font-body">
              Derivative v{depth}.{indexInRow}
            </p>
          )}
        </div>
      </button>
      {showBottomConnector && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-surface_bright" />
      )}
    </div>
  );
}
