import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GitBranch, Clock, Eye, TrendingUp, X } from 'lucide-react';
import { GET_SEARCH } from '../apollo/queries';
import { REMOVE_FILTER_FROM_SEARCH } from '../apollo/mutations';
import { KeywordTag } from '../components/ui/KeywordTag';
import { StatusDot } from '../components/ui/StatusDot';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ForkModal } from '../components/search/ForkModal';
import { timeAgo } from '../lib/utils';

export function SearchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [forkOpen, setForkOpen] = useState(false);

  const { data, loading } = useQuery(GET_SEARCH, { variables: { id } });
  const search = data?.search;

  const [removeFilter] = useMutation(REMOVE_FILTER_FROM_SEARCH, {
    refetchQueries: [{ query: GET_SEARCH, variables: { id } }],
  });

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

  const parentPath = search.parents?.length
    ? search.parents.map((p: any) => p.name).join(' + ')
    : null;

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
                <Clock size={12} /> Version History
              </button>
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
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs py-1">Save Preset</button>
                    <button className="btn-secondary text-xs py-1">Import</button>
                  </div>
                </div>
                {search.filters?.length > 0 ? (
                  <div className="space-y-3">
                    {search.filters.map((f: any) => (
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
                      {search.articles?.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="overline text-on_surface_variant mb-1">TRUE MATCHES</p>
                    <p className="font-display font-bold text-headline-sm text-secondary">
                      {search.articles?.length ? '82%' : '—'}
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
              <div className="card p-5 h-full">
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
                <div className="space-y-4">
                  {search.articles?.slice(0, 5).map((article: any) => (
                    <div key={article.id} className="border-b border-surface_bright/10 pb-4 last:border-0 last:pb-0">
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
                        <Badge variant={article.sentiment.toLowerCase() as any}>{article.sentiment}</Badge>
                      </div>
                    </div>
                  ))}
                  {(!search.articles || search.articles.length === 0) && (
                    <p className="text-body-sm text-on_surface_variant font-body">No results yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForkModal open={forkOpen} onClose={() => setForkOpen(false)} search={search} />
    </>
  );
}
