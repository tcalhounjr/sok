import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Sliders, AlertTriangle, Zap, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import type { Search } from '../../types';
import { StatusDot } from '../ui/StatusDot';
import { KeywordTag } from '../ui/KeywordTag';
import { timeAgo } from '../../lib/utils';
import { DELETE_SEARCH } from '../../apollo/mutations';

interface SearchCardProps {
  search: Search;
  onDeleted?: () => void;
}

export function SearchCard({ search, onDeleted }: SearchCardProps) {
  const navigate = useNavigate();
  const filterCount = search.filters?.length ?? 0;
  const isLive = search.status === 'active';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [deleteSearch] = useMutation(DELETE_SEARCH, {
    onCompleted: () => { onDeleted?.(); },
  });

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

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
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
            className="text-on_surface_variant opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-on_surface"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 w-36 glass rounded-md shadow-float border border-surface_bright/20 py-1">
              <button
                onClick={e => { e.stopPropagation(); navigate(`/search/${search.id}/edit`); }}
                className="w-full text-left px-3 py-2 text-body-sm text-on_surface font-body flex items-center gap-2 hover:bg-surface_container_high transition-colors"
              >
                <Edit size={12} className="text-on_surface" /> Edit
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm('Delete this search?')) {
                    deleteSearch({ variables: { id: search.id } });
                  }
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-body-sm text-error font-body flex items-center gap-2 hover:bg-error/10 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
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
