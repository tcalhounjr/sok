import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GitBranch, Clock, Edit, Eye, TrendingUp, X, Plus } from 'lucide-react';
import { GET_SEARCH, GET_FILTER_PRESETS } from '../apollo/queries';
import { REMOVE_FILTER_FROM_SEARCH, APPLY_FILTER_TO_SEARCH } from '../apollo/mutations';
import { KeywordTag } from '../components/ui/KeywordTag';
import { StatusDot } from '../components/ui/StatusDot';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { QueryErrorPanel } from '../components/ui/QueryErrorPanel';
import { ForkModal } from '../components/search/ForkModal';
import { ArticleDetailModal } from '../components/articles/ArticleDetailModal';
import { timeAgo } from '../lib/utils';
import type { Search, Article, FilterPreset } from '../types';

const PAGE_SIZE = 200;

export function SearchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [forkOpen, setForkOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);
  const filterPickerRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, refetch, fetchMore } = useQuery(GET_SEARCH, {
    variables: { id, offset: 0 },
  });
  const search: Search | undefined = data?.search;

  const [removeFilter] = useMutation(REMOVE_FILTER_FROM_SEARCH, {
    refetchQueries: [{ query: GET_SEARCH, variables: { id, offset: 0 } }],
  });

  const [applyFilter] = useMutation(APPLY_FILTER_TO_SEARCH, {
    refetchQueries: [{ query: GET_SEARCH, variables: { id, offset: 0 } }],
    onCompleted: () => setFilterPickerOpen(false),
  });

  const { data: presetsData } = useQuery(GET_FILTER_PRESETS);
  const allPresets: FilterPreset[] = presetsData?.filterPresets ?? [];
  const appliedIds = new Set((search?.filters ?? []).map((f: FilterPreset) => f.id));
  const availablePresets = allPresets.filter(p => !appliedIds.has(p.id));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterPickerRef.current && !filterPickerRef.current.contains(e.target as Node)) {
        setFilterPickerOpen(false);
      }
    }
    if (filterPickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterPickerOpen]);

  function handleLoadMore() {
    const nextOffset = offset + PAGE_SIZE;
    fetchMore({
      variables: { id, offset: nextOffset },
      updateQuery(prev, { fetchMoreResult }) {
        if (!fetchMoreResult) return prev;
        const newArticles: Article[] = fetchMoreResult.search.articles ?? [];
        if (newArticles.length < PAGE_SIZE) {
          setHasMore(false);
        }
        return {
          ...prev,
          search: {
            ...prev.search,
            articles: [
              ...(prev.search.articles ?? []),
              ...newArticles,
            ],
          },
        };
      },
    });
    setOffset(nextOffset);
  }

  if (error) return (
    <div className="p-8 h-full">
      <QueryErrorPanel
        message="Unable to load search details. Check your connection and try again."
        onRetry={refetch}
      />
    </div>
  );

  if (loading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );

  if (!search) return (
    <div className="p-8 text-on_surface_variant text-body-md">Search not found.</div>
  );

  const parentPath: string | null = search.parents?.length
    ? search.parents.map((p: Search) => p.name).join(' + ')
    : null;

  const articles: Article[] = search.articles ?? [];

  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 p-8 overflow-y-auto">
          {parentPath && (
            <div className="flex items-center gap-2 mb-2">
              <p className="overline text-on_surface_variant">
                {search.collection?.name?.toUpperCase() ?? 'LIBRARY'}
              </p>
              <span className="text-on_surface_variant text-xs">›</span>
              <p className="overline text-on_surface_variant">{parentPath.toUpperCase()}</p>
            </div>
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-headline-md text-on_surface">{search.name}</h1>
              <Badge variant="active">LIVE_TRACKING</Badge>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/lineage/${id}`)}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <Clock size={12} /> View Lineage
              </button>
              {id && (
                <button
                  onClick={() => navigate(`/search/${id}/edit`)}
                  className="btn-secondary flex items-center gap-2 text-xs"
                >
                  <Edit size={12} /> Edit
                </button>
              )}
              <button
                onClick={() => setForkOpen(true)}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <GitBranch size={12} /> Fork Search
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Base Keywords */}
            <div className="col-span-1 space-y-4">
              <div className="card p-5">
                <p className="overline text-on_surface_variant mb-3">BASE KEYWORDS</p>
                <div className="space-y-3">
                  {search.keywords.map((kw: string) => (
                    <div key={kw} className="p-3 bg-surface_container_high rounded-sm ghost-border">
                      <KeywordTag label={`"${kw}"`} />
                      <p className="text-label-sm text-on_surface_variant font-body mt-1.5">
                        Required in all primary nodes.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <p className="overline text-on_surface_variant mb-3">EXCLUSION LOGIC</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="negative">RETAIL_MARKET</Badge>
                  <Badge variant="negative">CRYPTO_CURRENCY</Badge>
                </div>
              </div>

              <div className="p-4 bg-surface_container rounded-sm ghost-border">
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status="active" pulse />
                  <p className="overline text-secondary">NODE SYNCING</p>
                </div>
                <p className="text-label-sm text-on_surface_variant font-body">
                  Last updated: {timeAgo(search.updatedAt)} by AI_ORCHESTRATOR_V2
                </p>
              </div>
            </div>

            {/* Refinement Panel */}
            <div className="col-span-1 space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="overline text-on_surface_variant">REFINEMENT PRESETS</p>
                  <div className="relative" ref={filterPickerRef}>
                    <button
                      onClick={() => setFilterPickerOpen(o => !o)}
                      className="btn-secondary text-xs py-1 flex items-center gap-1"
                    >
                      <Plus size={10} /> Apply Filter
                    </button>
                    {filterPickerOpen && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-surface_container_high rounded-sm ghost-border shadow-ambient z-10">
                        {availablePresets.length === 0 ? (
                          <p className="text-body-sm text-on_surface_variant font-body p-3">
                            No presets available. Create one in the Preset Library.
                          </p>
                        ) : (
                          <div className="py-1 max-h-48 overflow-y-auto">
                            {availablePresets.map(p => (
                              <button
                                key={p.id}
                                onClick={() => applyFilter({ variables: { filterId: p.id, searchId: id } })}
                                className="w-full text-left px-3 py-2 hover:bg-surface_container transition-colors"
                              >
                                <p className="overline text-on_tertiary_container">{p.type}</p>
                                <p className="text-body-sm text-on_surface font-body truncate">{p.name}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {search.filters && search.filters.length > 0 ? (
                  <div className="space-y-3">
                    {search.filters.map((f: FilterPreset) => (
                      <div key={f.id} className="p-3 bg-surface_container_high rounded-sm ghost-border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="overline text-on_tertiary_container">{f.type}</p>
                          <button
                            onClick={() => removeFilter({ variables: { filterId: f.id, searchId: id } })}
                            className="text-on_surface_variant hover:text-error transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <Badge variant="default">{f.value}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-on_surface_variant font-body">No filters applied.</p>
                )}
              </div>

              <div className="card p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="overline text-on_surface_variant mb-1">SIGNAL DENSITY</p>
                    <p className="font-display font-bold text-headline-sm text-on_surface">
                      {articles.length}
                    </p>
                  </div>
                  <div>
                    <p className="overline text-on_surface_variant mb-1">TRUE MATCHES</p>
                    <p className="font-display font-bold text-headline-sm text-secondary">
                      {articles.length ? '82%' : '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/trends/${id}`)}
                  className="w-full btn-secondary text-xs mt-4 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={12} /> View Narrative Trends
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="col-span-1">
              <div className="card p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={13} className="text-on_surface_variant" />
                    <p className="overline text-on_surface_variant">LIVE PREVIEW</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status="active" pulse />
                    <span className="overline text-secondary">STREAMING</span>
                  </div>
                </div>

                {/* Article count label */}
                {articles.length > 0 && (
                  <p className="text-label-sm text-on_surface_variant font-body mb-3">
                    Showing {articles.length} articles
                  </p>
                )}

                <div className="space-y-4 flex-1">
                  {articles.slice(0, 5).map((article: Article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticleId(article.id)}
                      className="w-full text-left border-b border-surface_bright/10 pb-4 last:border-0 last:pb-0 hover:bg-surface_container_high/30 rounded-sm transition-colors -mx-1 px-1"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="overline text-on_surface_variant flex-1 truncate">
                          {article.source?.name?.toUpperCase()} | {timeAgo(article.publishedAt).toUpperCase()}
                        </p>
                        <span className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${
                          article.sentiment === 'POSITIVE' ? 'bg-secondary' :
                          article.sentiment === 'NEGATIVE' ? 'bg-error' : 'bg-tertiary'
                        }`} />
                      </div>
                      <p className="text-body-sm text-on_surface font-body leading-snug line-clamp-2">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={article.sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative'}>{article.sentiment}</Badge>
                      </div>
                    </button>
                  ))}
                  {articles.length === 0 && (
                    <p className="text-body-sm text-on_surface_variant font-body">No results yet.</p>
                  )}
                </div>

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full btn-secondary text-xs mt-4"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForkModal open={forkOpen} onClose={() => setForkOpen(false)} search={search} />
      <ArticleDetailModal
        articleId={selectedArticleId}
        onClose={() => setSelectedArticleId(null)}
      />
    </>
  );
}
