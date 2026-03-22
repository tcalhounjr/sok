import { Plus, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { Collection } from '../../types';

interface CollectionSidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  loading: boolean;
  filterInput: string;
  showNewCol: boolean;
  newColName: string;
  onFilterChange: (val: string) => void;
  onSelect: (id: string) => void;
  onNewColToggle: () => void;
  onNewColNameChange: (val: string) => void;
  onNewColSubmit: () => void;
  onNewColCancel: () => void;
}

export function CollectionSidebar({
  collections, activeCollectionId, loading,
  filterInput, showNewCol, newColName,
  onFilterChange, onSelect, onNewColToggle,
  onNewColNameChange, onNewColSubmit, onNewColCancel,
}: CollectionSidebarProps) {
  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(filterInput.toLowerCase())
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-surface_container_low border-r border-surface_bright/10 flex flex-col">
      <div className="p-4 border-b border-surface_bright/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-on_surface text-sm">Collections</h2>
          <button
            onClick={onNewColToggle}
            className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
          >
            <Plus size={10} /> New
          </button>
        </div>
        <div className="relative">
          <SearchIcon size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on_surface_variant" />
          <input
            value={filterInput}
            onChange={e => onFilterChange(e.target.value)}
            placeholder="Filter collections..."
            className="w-full pl-7 pr-3 py-1.5 bg-surface_container rounded-sm text-body-sm text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none"
          />
        </div>
      </div>

      {showNewCol && (
        <div className="p-3 border-b border-surface_bright/10">
          <input
            value={newColName}
            onChange={e => onNewColNameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newColName.trim()) onNewColSubmit();
              if (e.key === 'Escape') onNewColCancel();
            }}
            autoFocus
            placeholder="Collection name..."
            className="w-full px-2 py-1.5 bg-surface_container_high rounded-sm text-body-sm text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none"
          />
          <p className="text-label-sm text-on_surface_variant font-body mt-1">
            Enter to save, Esc to cancel
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
          : filtered.map(col => (
              <button
                key={col.id}
                onClick={() => onSelect(col.id)}
                className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between group ${
                  activeCollectionId === col.id
                    ? 'bg-surface_container_high text-on_surface'
                    : 'hover:bg-surface_container text-on_surface_variant hover:text-on_surface'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 ${
                    activeCollectionId === col.id ? 'bg-gradient-primary' : 'bg-surface_container_high'
                  }`}>
                    <span className="text-xs text-on_primary">◈</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-body truncate">{col.name}</p>
                    <p className="text-label-sm text-on_surface_variant font-body">
                      {col.searches?.length ?? 0} ACTIVE SEARCHES
                    </p>
                  </div>
                </div>
                <ChevronRight size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
        }
      </nav>

      <div className="p-4 border-t border-surface_bright/10 space-y-1">
        <button className="text-label-sm text-on_surface_variant font-body hover:text-on_surface transition-colors w-full text-left">
          ⓘ Support
        </button>
        <button className="text-label-sm text-on_surface_variant font-body hover:text-on_surface transition-colors w-full text-left">
          &lt;/&gt; API Docs
        </button>
      </div>
    </aside>
  );
}
