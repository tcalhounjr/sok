import { useQuery } from '@apollo/client';
import { ExternalLink } from 'lucide-react';
import { GET_ARTICLE } from '../../apollo/queries';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ArticleDetailModalProps {
  articleId: string | null;
  onClose: () => void;
}

const TIER_LABELS: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

function sentimentVariant(s: string): 'positive' | 'negative' | 'neutral' {
  if (s === 'POSITIVE') return 'positive';
  if (s === 'NEGATIVE') return 'negative';
  return 'neutral';
}

function sentimentLabel(s: string): string {
  if (s === 'POSITIVE') return 'Positive';
  if (s === 'NEGATIVE') return 'Negative';
  return 'Neutral';
}

function sentimentBarColor(s: string): string {
  if (s === 'POSITIVE') return 'bg-secondary';
  if (s === 'NEGATIVE') return 'bg-error';
  return 'bg-tertiary';
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function ArticleDetailModal({ articleId, onClose }: ArticleDetailModalProps) {
  const { data, loading } = useQuery(GET_ARTICLE, {
    variables: { id: articleId },
    skip: !articleId,
  });

  const article = data?.article;

  return (
    <Modal
      open={!!articleId}
      onClose={onClose}
      overline="ARTICLE DETAIL"
      title={loading ? 'Loading…' : article?.headline ?? 'Article'}
      className="max-w-3xl"
    >
      {loading ? (
        <div className="px-6 pb-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48" />
        </div>
      ) : article ? (
        <div className="px-6 pb-6 space-y-5">
          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-3">
            <span className="text-body-sm text-on_surface_variant font-body">
              {formatDate(article.publishedAt)}
            </span>

            {article.source && (
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-on_surface font-body">{article.source.name}</span>
                {article.source.tier && (
                  <Badge variant="default">
                    {TIER_LABELS[article.source.tier] ?? `Tier ${article.source.tier}`}
                  </Badge>
                )}
              </div>
            )}

            {article.author && (
              <span className="text-body-sm text-on_surface_variant font-body">
                by {article.author.name}
              </span>
            )}
          </div>

          {/* Sentiment */}
          <div className="flex items-center gap-3">
            <p className="overline text-on_surface_variant">SENTIMENT</p>
            <Badge variant={sentimentVariant(article.sentiment)}>
              {sentimentLabel(article.sentiment)}
            </Badge>
            {/* Visual sentiment bar */}
            <div className="flex-1 h-1 bg-surface_container_high rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', sentimentBarColor(article.sentiment))}
                style={{
                  width: article.sentiment === 'POSITIVE' ? '80%'
                       : article.sentiment === 'NEGATIVE' ? '75%'
                       : '50%',
                }}
              />
            </div>
          </div>

          {/* Body */}
          {article.body ? (
            <div className="bg-surface_container_high rounded-lg p-4 ghost-border max-h-64 overflow-y-auto">
              <p className="text-body-md text-on_surface font-body leading-relaxed whitespace-pre-wrap">
                {article.body}
              </p>
            </div>
          ) : (
            <p className="text-body-sm text-on_surface_variant font-body italic">
              Article body not available.
            </p>
          )}

          {/* External link */}
          {article.url && isSafeUrl(article.url) && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline font-body"
            >
              <ExternalLink size={12} /> View original article
            </a>
          )}
        </div>
      ) : (
        <div className="px-6 pb-6" role="alert">
          <p className="text-body-sm text-on_surface_variant font-body">Article not found.</p>
        </div>
      )}
    </Modal>
  );
}
