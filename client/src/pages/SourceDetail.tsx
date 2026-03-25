import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ArrowLeft, Globe, Layers, BarChart2 } from 'lucide-react';
import { GET_SOURCE, GET_SOURCE_ARTICLES } from '../apollo/queries';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { QueryErrorPanel } from '../components/ui/QueryErrorPanel';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const TIER_LABELS: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };
const TIER_VARIANTS: Record<number, 'active' | 'neutral' | 'archived'> = {
  1: 'active',
  2: 'neutral',
  3: 'archived',
};

function sentimentVariant(s: string): 'positive' | 'negative' | 'neutral' {
  if (s === 'POSITIVE') return 'positive';
  if (s === 'NEGATIVE') return 'negative';
  return 'neutral';
}

export function SourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: sourceData, loading: sourceLoading, error: sourceError, refetch: refetchSource } =
    useQuery(GET_SOURCE, { variables: { id }, skip: !id });

  const { data: articlesData, loading: articlesLoading, error: articlesError, refetch: refetchArticles } =
    useQuery(GET_SOURCE_ARTICLES, {
      variables: { sourceId: id, limit: 20, offset: 0 },
      skip: !id,
    });

  const source = sourceData?.source;
  const articles: any[] = articlesData?.sourceArticles ?? [];

  // Compute sentiment breakdown from fetched articles
  const total = articles.length;
  const positiveCount = articles.filter(a => a.sentiment === 'POSITIVE').length;
  const neutralCount  = articles.filter(a => a.sentiment === 'NEUTRAL').length;
  const negativeCount = articles.filter(a => a.sentiment === 'NEGATIVE').length;
  const positivePct = total ? Math.round((positiveCount / total) * 100) : 0;
  const neutralPct  = total ? Math.round((neutralCount  / total) * 100) : 0;
  const negativePct = total ? Math.round((negativeCount / total) * 100) : 0;

  const loading = sourceLoading || articlesLoading;

  if (sourceError) return (
    <div className="p-8 h-full">
      <QueryErrorPanel
        message="Unable to load source details. Check your connection and try again."
        onRetry={refetchSource}
      />
    </div>
  );

  if (articlesError) return (
    <div className="p-8 h-full">
      <QueryErrorPanel
        message="Unable to load source articles. Check your connection and try again."
        onRetry={refetchArticles}
      />
    </div>
  );

  return (
    <div className="p-8 overflow-y-auto h-full">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-body-sm text-on_surface_variant hover:text-on_surface transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="overline text-on_surface_variant mb-1">MEDIA SOURCE</p>
          {loading
            ? <Skeleton className="h-9 w-72 mb-2" />
            : <h1 className="font-display text-headline-md text-on_surface mb-2">{source?.name ?? '—'}</h1>
          }
          {loading
            ? <Skeleton className="h-5 w-48" />
            : source && (
                <div className="flex items-center gap-3">
                  <Badge variant={TIER_VARIANTS[source.tier] ?? 'default'}>
                    {TIER_LABELS[source.tier] ?? `Tier ${source.tier}`}
                  </Badge>
                  <span className="flex items-center gap-1 text-body-sm text-on_surface_variant font-body">
                    <Globe size={12} /> {source.region}
                  </span>
                  <span className="flex items-center gap-1 text-body-sm text-on_surface_variant font-body">
                    <Layers size={12} /> {source.language?.toUpperCase()}
                  </span>
                </div>
              )
          }
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} className="text-on_surface_variant" />
          <p className="overline text-on_surface_variant">SENTIMENT BREAKDOWN</p>
          <span className="text-label-sm text-on_surface_variant font-body ml-auto">
            {total} articles analysed
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-16" />
        ) : total === 0 ? (
          <p className="text-body-sm text-on_surface_variant font-body">No articles available for sentiment analysis.</p>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-3">
              {positivePct > 0 && (
                <div className="bg-secondary" style={{ width: `${positivePct}%` }} />
              )}
              {neutralPct > 0 && (
                <div className="bg-tertiary" style={{ width: `${neutralPct}%` }} />
              )}
              {negativePct > 0 && (
                <div className="bg-error" style={{ width: `${negativePct}%` }} />
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-secondary" />
                <span className="text-label-sm text-on_surface_variant font-body">
                  Positive {positivePct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-tertiary" />
                <span className="text-label-sm text-on_surface_variant font-body">
                  Neutral {neutralPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-error" />
                <span className="text-label-sm text-on_surface_variant font-body">
                  Negative {negativePct}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Articles */}
      <div className="card p-5">
        <p className="overline text-on_surface_variant mb-4">RECENT ARTICLES</p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-body-sm text-on_surface_variant font-body">No articles found for this source.</p>
        ) : (
          <div className="space-y-0">
            {articles.map((article, i) => (
              <div
                key={article.id}
                className={cn(
                  'flex items-start justify-between py-3 gap-4',
                  i < articles.length - 1 && 'border-b border-surface_bright/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-on_surface font-body leading-snug mb-1">
                    {article.headline}
                  </p>
                  <p className="text-label-sm text-on_surface_variant font-body">
                    {formatDate(article.publishedAt)}
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
    </div>
  );
}
