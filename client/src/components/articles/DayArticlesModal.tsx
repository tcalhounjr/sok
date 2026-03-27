import { useQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { GET_SEARCH_ARTICLES_ON_DATE } from '../../apollo/queries';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface DayArticlesModalProps {
  searchId: string;
  date: string | null;
  onClose: () => void;
}

function sentimentVariant(s: string): 'positive' | 'negative' | 'neutral' {
  if (s === 'POSITIVE') return 'positive';
  if (s === 'NEGATIVE') return 'negative';
  return 'neutral';
}

export function DayArticlesModal({ searchId, date, onClose }: DayArticlesModalProps) {
  const { data, loading } = useQuery(GET_SEARCH_ARTICLES_ON_DATE, {
    variables: { searchId, date },
    skip: !date,
  });

  if (!date) return null;

  const articles: any[] = data?.searchArticlesOnDate ?? [];
  const total = articles.length;
  const pos = articles.filter(a => a.sentiment === 'POSITIVE').length;
  const neu = articles.filter(a => a.sentiment === 'NEUTRAL').length;
  const neg = articles.filter(a => a.sentiment === 'NEGATIVE').length;
  const posPct = total ? Math.round((pos / total) * 100) : 0;
  const neuPct = total ? Math.round((neu / total) * 100) : 0;
  const negPct = total ? Math.round((neg / total) * 100) : 0;

  const displayDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface_container rounded-sm ghost-border shadow-float w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-surface_bright/10">
          <div>
            <p className="overline text-on_surface_variant mb-1">COVERAGE — {date}</p>
            <h2 className="font-display font-semibold text-on_surface text-headline-sm">{displayDate}</h2>
          </div>
          <button onClick={onClose} className="text-on_surface_variant hover:text-on_surface transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <>
            {/* Sentiment mini-bar */}
            {total > 0 && (
              <div className="px-5 pt-4 pb-3 border-b border-surface_bright/10">
                <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                  {posPct > 0 && <div className="bg-secondary" style={{ width: `${posPct}%` }} />}
                  {neuPct > 0 && <div className="bg-tertiary" style={{ width: `${neuPct}%` }} />}
                  {negPct > 0 && <div className="bg-error" style={{ width: `${negPct}%` }} />}
                </div>
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-1.5 text-label-sm text-on_surface_variant font-body">
                    <span className="w-1.5 h-1.5 rounded-sm bg-secondary" /> {pos} positive
                  </span>
                  <span className="flex items-center gap-1.5 text-label-sm text-on_surface_variant font-body">
                    <span className="w-1.5 h-1.5 rounded-sm bg-tertiary" /> {neu} neutral
                  </span>
                  <span className="flex items-center gap-1.5 text-label-sm text-on_surface_variant font-body">
                    <span className="w-1.5 h-1.5 rounded-sm bg-error" /> {neg} negative
                  </span>
                </div>
              </div>
            )}

            {/* Article list */}
            <div className="overflow-y-auto flex-1 p-5">
              {articles.length === 0 ? (
                <p className="text-body-sm text-on_surface_variant font-body">No articles on this date.</p>
              ) : (
                <div className="space-y-0">
                  {articles.map((article, i) => (
                    <div
                      key={article.id}
                      className={`py-3 flex items-start justify-between gap-4 ${i < articles.length - 1 ? 'border-b border-surface_bright/10' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="overline text-on_surface_variant mb-1 truncate">
                          {article.source?.name?.toUpperCase()}
                        </p>
                        <p className="text-body-sm text-on_surface font-body leading-snug">
                          {article.headline}
                        </p>
                      </div>
                      <Badge variant={sentimentVariant(article.sentiment)}>
                        {article.sentiment}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
