import { Skeleton } from '../ui/Skeleton';
import { TopTopicCount } from '../../types';

interface TopicCloudProps {
  topics: TopTopicCount[];
  loading: boolean;
}

function topicSize(count: number, max: number): string {
  const r = count / max;
  if (r > 0.8) return 'text-lg font-bold text-on_surface';
  if (r > 0.5) return 'text-base font-semibold text-on_surface';
  if (r > 0.3) return 'text-sm font-medium text-on_surface_variant';
  return 'text-xs text-on_surface_variant';
}

export function TopicCloud({ topics, loading }: TopicCloudProps) {
  const max = Math.max(...(topics.map(t => t.count) ?? [1]));

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-on_surface text-sm mb-4">Top Co-occurring Topics</h3>
      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="flex flex-wrap gap-3 items-end">
          {topics.slice(0, 10).map(({ topic, count }) => (
            <span
              key={topic.id}
              className={`font-body cursor-pointer hover:text-secondary transition-colors ${topicSize(count, max)}`}
            >
              #{topic.label.toLowerCase().replace(/\s+/g, '_')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
