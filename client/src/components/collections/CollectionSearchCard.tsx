import { useNavigate } from 'react-router-dom';
import { StatusDot } from '../ui/StatusDot';
import type { Search } from '../../types';
import { timeAgo } from '../../lib/utils';

interface CollectionSearchCardProps {
  search: Search;
  collectionId: string;
  onRemove: (searchId: string, collectionId: string) => void;
}

export function CollectionSearchCard({ search, collectionId, onRemove }: CollectionSearchCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`card p-4 cursor-pointer hover:bg-surface_container_high transition-colors group ${
        search.status === 'active'   ? 'border-l-2 border-secondary' :
        search.status === 'archived' ? '' : 'border-l-2 border-error'
      }`}
      onClick={() => navigate(`/search/${search.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={search.status as any} pulse={search.status === 'active'} />
          <span className="mono-id">ID: SX-{search.id.slice(-4).toUpperCase()}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(search.id, collectionId); }}
          className="text-on_surface_variant opacity-0 group-hover:opacity-100 hover:text-error transition-all text-xs"
        >
          ✕
        </button>
      </div>
      <h3 className="font-display font-semibold text-on_surface text-sm mb-1 leading-snug">
        {search.name}
      </h3>
      <p className="text-body-sm text-on_surface_variant font-body line-clamp-2 mb-3">
        Keywords: {search.keywords?.slice(0, 3).join(', ')}
        {(search.keywords?.length ?? 0) > 3 ? '…' : ''}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-on_surface_variant font-body">
          {search.articles?.length ?? '—'} RESULTS
        </span>
        <span className="text-label-sm text-on_surface_variant font-body">
          UPDATED {timeAgo(search.updatedAt).toUpperCase()}
        </span>
      </div>
      {search.status === 'active' && (
        <p className="text-label-sm text-secondary font-body mt-1 uppercase tracking-widest">
          Live Feed
        </p>
      )}
    </div>
  );
}
