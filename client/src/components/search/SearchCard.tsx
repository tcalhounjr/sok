import { MoreVertical, Sliders, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Search } from '../../types';
import { StatusDot } from '../ui/StatusDot';
import { KeywordTag } from '../ui/KeywordTag';
import { timeAgo, cn } from '../../lib/utils';

interface SearchCardProps {
  search: Search;
  onDelete?: (id: string) => void;
}

function GrowthIndicator({ search }: { search: Search }) {
  const hasDerivatives = (search.derivatives?.length ?? 0) > 0;
  if (hasDerivatives) return (
    <span className="text-secondary text-label-sm font-body flex items-center gap-1">
      <TrendingUp size={11} /> +{search.derivatives!.length * 412} GROWTH
    </span>
  );
  return <span className="text-on_surface_variant text-label-sm font-body">GROWTH: STEADY</span>;
}

export function SearchCard({ search, onDelete }: SearchCardProps) {
  const navigate = useNavigate();
  const filterCount = search.filters?.length ?? 0;
  const isLive = search.status === 'active';

  return (
    <div
      className="card p-5 cursor-pointer hover:bg-surface_container_high transition-colors group"
      onClick={() => navigate(`/search/${search.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={search.status as any} pulse={isLive} />
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-on_surface text-sm leading-tight truncate">
              {search.name}
            </h3>
            <p className="text-label-sm text-on_surface_variant mt-0.5 font-body">
              UPDATED {timeAgo(search.updatedAt).toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); }}
          className="text-on_surface_variant opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-on_surface"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {search.keywords.slice(0, 3).map(kw => (
          <KeywordTag key={kw} label={`"${kw}"`} mono />
        ))}
        {search.keywords.length > 3 && (
          <span className="text-label-sm text-on_surface_variant font-body self-center">
            +{search.keywords.length - 3}
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {filterCount > 0 && (
            <span className="flex items-center gap-1 text-label-sm text-on_surface_variant font-body">
              <Sliders size={11} /> {filterCount} FILTER{filterCount !== 1 ? 'S' : ''} APPLIED
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 text-label-sm text-secondary font-body">
              <Zap size={11} /> LIVE
            </span>
          )}
          {(search.derivatives?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-label-sm text-tertiary font-body">
              <AlertTriangle size={11} /> HIGH VOLATILITY
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/trends/${search.id}`); }}
          className="text-label-sm text-primary font-body hover:text-on_surface transition-colors flex items-center gap-1"
        >
          View Analytics <span className="text-xs">›</span>
        </button>
      </div>
    </div>
  );
}
