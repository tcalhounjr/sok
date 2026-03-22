import { Skeleton } from '../ui/Skeleton';
import type { TopSourceCount } from '../../types';

interface SourceRankingsProps {
  sources: TopSourceCount[];
  totalArticles: number;
  loading: boolean;
}

export function SourceRankings({ sources, totalArticles, loading }: SourceRankingsProps) {
  const maxCount = sources[0]?.count ?? 1;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-on_surface text-sm">Top Sources</h3>
        <button className="text-label-sm text-primary font-body hover:underline">
          VIEW ALL {totalArticles || ''} SOURCES
        </button>
      </div>
      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="space-y-3">
          {sources.slice(0, 5).map(({ source, count }) => {
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={source.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body-sm text-on_surface font-body">{source.name}</span>
                  <span className="text-label-sm text-on_surface_variant font-body">
                    {count.toLocaleString()} hits
                  </span>
                </div>
                <div className="h-0.5 bg-surface_container_high rounded-full overflow-hidden">
                  <div className="h-full bg-on_surface_variant rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
