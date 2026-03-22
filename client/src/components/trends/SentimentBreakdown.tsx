import { Skeleton } from '../ui/Skeleton';
import type { SentimentBreakdown as SentimentBreakdownType } from '../../types';

interface SentimentBreakdownProps {
  data: SentimentBreakdownType | null;
  loading: boolean;
}

const ROWS = [
  { key: 'positivePercent' as const, label: 'Positive', color: '#4edea3' },
  { key: 'neutralPercent'  as const, label: 'Neutral',  color: '#ffb95f' },
  { key: 'negativePercent' as const, label: 'Negative', color: '#ffb4ab' },
];

export function SentimentBreakdown({ data, loading }: SentimentBreakdownProps) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-on_surface text-sm mb-0.5">Sentiment Breakdown</h3>
      <p className="overline text-on_surface_variant mb-4">AGGREGATE TONE ANALYSIS</p>
      {loading ? (
        <Skeleton className="h-40" />
      ) : data ? (
        <>
          {/* Stacked bar */}
          <div className="flex h-2 rounded-full overflow-hidden mb-4">
            {ROWS.map(({ key, color }) => (
              <div key={key} style={{ width: `${data[key]}%`, backgroundColor: color }} />
            ))}
          </div>
          <div className="space-y-3">
            {ROWS.map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-body-sm text-on_surface font-body">{label}</span>
                </div>
                <span className="font-display font-semibold" style={{ color }}>{data[key]}%</span>
              </div>
            ))}
          </div>
          {data.periodShift != null && (
            <p className="text-label-sm text-on_surface_variant font-body mt-4 italic">
              SHIFT: +{data.negativePercent}% NEGATIVE VS LAST PERIOD
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
