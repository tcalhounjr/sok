import { StatusDot } from '../ui/StatusDot';
import type { SearchLineage } from '../../types';

interface LineageStatsProps {
  lineage: SearchLineage;
}

export function LineageStats({ lineage }: LineageStatsProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-surface_bright/10">
        {[
          { label: 'TOTAL NODES',    value: lineage.totalNodes,          icon: '✦' },
          { label: 'AVG BRANCHING',  value: '2.4',                        icon: '⇢' },
          { label: 'MAX DEPTH',      value: `${lineage.maxDepth} Levels`, icon: '↓' },
          { label: 'ORPHAN QUERIES', value: lineage.orphanCount,          icon: '✦' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="text-center">
            <p className="text-xl text-on_surface_variant mb-1">{icon}</p>
            <p className="overline text-on_surface_variant mb-1">{label}</p>
            <p className="font-display font-bold text-headline-sm text-on_surface">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center mt-6 pt-4 border-t border-surface_bright/10">
        <div className="flex items-center gap-2">
          <StatusDot status="active" pulse />
          <span className="text-label-sm text-on_surface_variant font-body">
            System Status: Latency 24ms
          </span>
        </div>
      </div>
    </>
  );
}
