import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, X } from 'lucide-react';
import { GET_COLLECTIONS, GET_SEARCHES } from '../apollo/queries';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import {
  CREATE_COLLECTION,
  ADD_SEARCH_TO_COLLECTION,
  REMOVE_SEARCH_FROM_COLLECTION,
} from '../apollo/mutations';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { QueryErrorPanel } from '../components/ui/QueryErrorPanel';
import { CollectionSidebar } from '../components/collections/CollectionSidebar';
import { CollectionSearchCard } from '../components/collections/CollectionSearchCard';
import { CollaboratorAvatars } from '../components/collections/CollaboratorAvatars';
import type { Collection, Search } from '../types';

export function CollectionManagement() {
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [filterInput, setFilterInput] = useState('');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [newColName, setNewColName] = useState('');
  const [showNewCol, setShowNewCol] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: 'Dashboard', path: '/' },
      { label: 'Collections', path: '/collections' },
    ]);
  }, [setCrumbs]);
  const [linkModalFilter, setLinkModalFilter] = useState('');
  const linkModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (linkModalRef.current && !linkModalRef.current.contains(e.target as Node)) {
        setLinkModalOpen(false);
      }
    }
    if (linkModalOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [linkModalOpen]);

  const { data: colData, loading: colLoading, error: colError, refetch: refetchCollections } = useQuery(GET_COLLECTIONS);
  const { data: searchData, error: searchError, refetch: refetchSearches } = useQuery(GET_SEARCHES);

  const collections: Collection[] = colData?.collections ?? [];
  const allSearches: Search[] = searchData?.searches ?? [];
  const activeCollection = collections.find(c => c.id === activeColId) ?? collections[0] ?? null;

  const [createCollection] = useMutation(CREATE_COLLECTION, {
    refetchQueries: [{ query: GET_COLLECTIONS }],
    onCompleted: d => {
      setActiveColId(d.createCollection.id);
      setShowNewCol(false);
      setNewColName('');
    },
  });

  const [addSearch] = useMutation(ADD_SEARCH_TO_COLLECTION, {
    refetchQueries: [{ query: GET_COLLECTIONS }],
    onCompleted: () => {
      setLinkModalOpen(false);
      setLinkModalFilter('');
    },
  });

  const [removeSearch] = useMutation(REMOVE_SEARCH_FROM_COLLECTION, {
    refetchQueries: [{ query: GET_COLLECTIONS }],
  });

  function handleQuickAdd() {
    if (!quickAddInput.trim()) {
      setLinkModalOpen(true);
      return;
    }
    if (!activeCollection) return;
    const match = allSearches.find(s =>
      s.id === quickAddInput.trim() ||
      s.name.toLowerCase().includes(quickAddInput.toLowerCase())
    );
    if (match) {
      addSearch({ variables: { searchId: match.id, collectionId: activeCollection.id } });
      setQuickAddInput('');
    }
  }

  function handleRemoveSearch(searchId: string, collectionId: string) {
    removeSearch({ variables: { searchId, collectionId } });
  }

  return (
    <div className="flex h-full">
      <CollectionSidebar
        collections={collections}
        activeCollectionId={activeCollection?.id ?? null}
        loading={colLoading}
        filterInput={filterInput}
        showNewCol={showNewCol}
        newColName={newColName}
        onFilterChange={setFilterInput}
        onSelect={setActiveColId}
        onNewColToggle={() => setShowNewCol(true)}
        onNewColNameChange={setNewColName}
        onNewColSubmit={() => {
          if (newColName.trim()) {
            createCollection({ variables: { input: { name: newColName.trim() } } });
          }
        }}
        onNewColCancel={() => { setShowNewCol(false); setNewColName(''); }}
      />

      {colError ? (
        <QueryErrorPanel
          message="Unable to load collections. Check your connection and try again."
          onRetry={refetchCollections}
        />
      ) : searchError ? (
        <QueryErrorPanel
          message="Unable to load searches. Check your connection and try again."
          onRetry={refetchSearches}
        />
      ) : activeCollection ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-surface_bright/10 flex items-start justify-between">
            <div>
              <Badge variant="active" className="mb-2">ACTIVE COLLECTION</Badge>
              <h1 className="font-display font-bold text-headline-sm text-on_surface">
                {activeCollection.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                {activeCollection.totalArticles != null && (
                  <div>
                    <p className="overline text-on_surface_variant mb-0.5">TOTAL ARTICLES</p>
                    <p className="font-display font-semibold text-on_surface text-sm">
                      {activeCollection.totalArticles.toLocaleString()}
                    </p>
                  </div>
                )}
                {activeCollection.sentimentSummary && (
                  <div>
                    <p className="overline text-on_surface_variant mb-0.5">SENTIMENT</p>
                    <div className="flex items-center gap-2">
                      <div className="flex h-1.5 w-24 rounded-full overflow-hidden">
                        <div className="bg-secondary" style={{ width: `${activeCollection.sentimentSummary.positivePercent}%` }} />
                        <div className="bg-tertiary" style={{ width: `${activeCollection.sentimentSummary.neutralPercent}%` }} />
                        <div className="bg-error" style={{ width: `${activeCollection.sentimentSummary.negativePercent}%` }} />
                      </div>
                      <span className="text-label-sm text-on_surface_variant font-body">
                        {activeCollection.sentimentSummary.positivePercent}% POS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="text-on_surface_variant hover:text-on_surface transition-colors p-1">✕</button>
          </div>

          {/* Quick-add */}
          <div className="px-6 py-4 border-b border-surface_bright/10">
            <p className="overline text-on_surface_variant mb-2">QUICK-ADD SEARCH</p>
            <div className="flex items-center gap-3">
              <input
                value={quickAddInput}
                onChange={e => setQuickAddInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                placeholder="Enter search ID or keyword..."
                className="flex-1 px-3 py-2 bg-surface_container_high rounded-sm text-body-sm text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none"
              />
              <button onClick={handleQuickAdd} className="btn-primary text-xs">Add</button>
            </div>
          </div>

          {/* Search grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {activeCollection.searches?.map((search: Search) => (
                <CollectionSearchCard
                  key={search.id}
                  search={search}
                  collectionId={activeCollection.id}
                  onRemove={handleRemoveSearch}
                />
              ))}
              <button
                className="card p-4 flex flex-col items-center justify-center gap-3 hover:bg-surface_container_high transition-colors ghost-border border-dashed min-h-32"
                onClick={() => setLinkModalOpen(true)}
              >
                <div className="w-8 h-8 rounded-full bg-surface_container_high flex items-center justify-center">
                  <Plus size={14} className="text-on_surface_variant" />
                </div>
                <p className="overline text-on_surface_variant">LINK EXISTING SEARCH</p>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface_bright/10 flex items-center justify-between">
            <CollaboratorAvatars initials={['A', 'B', 'C']} overflow={3} />
            <button
              onClick={() => setActiveColId(null)}
              className="btn-secondary text-xs"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-on_surface_variant text-body-md font-body mb-3">No collection selected</p>
            <button onClick={() => setShowNewCol(true)} className="btn-primary text-xs">
              <Plus size={12} className="inline mr-1" /> New Collection
            </button>
          </div>
        </div>
      )}

      {/* Link search modal */}
      {linkModalOpen && activeCollection && (() => {
        const alreadyInCollection = new Set(
          (activeCollection.searches ?? []).map((s: Search) => s.id)
        );
        const available = allSearches.filter(s => !alreadyInCollection.has(s.id));
        const filtered = linkModalFilter.trim()
          ? available.filter(s => s.name.toLowerCase().includes(linkModalFilter.toLowerCase()))
          : available;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-label="Link existing search"
          >
            <div
              ref={linkModalRef}
              className="bg-surface_container_high ghost-border rounded-sm shadow-float w-[480px] max-h-[520px] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface_bright/10">
                <p className="overline text-on_surface_variant">LINK EXISTING SEARCH</p>
                <button
                  onClick={() => { setLinkModalOpen(false); setLinkModalFilter(''); }}
                  className="text-on_surface_variant hover:text-on_surface transition-colors"
                  aria-label="Close modal"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="px-5 py-3 border-b border-surface_bright/10">
                <input
                  autoFocus
                  value={linkModalFilter}
                  onChange={e => setLinkModalFilter(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full px-3 py-2 bg-surface_container rounded-sm text-body-sm text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-5 py-4 text-body-sm text-on_surface_variant font-body italic">
                    {available.length === 0
                      ? 'All searches are already in this collection.'
                      : 'No searches match your filter.'}
                  </p>
                ) : (
                  filtered.map((s: Search) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        addSearch({ variables: { searchId: s.id, collectionId: activeCollection.id } })
                      }
                      className="w-full text-left px-5 py-3 hover:bg-surface_container transition-colors"
                    >
                      <p className="text-body-sm text-on_surface font-body">{s.name}</p>
                      <p className="overline text-on_surface_variant">{s.status.toUpperCase()}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* System status toast */}
      <div className="fixed bottom-4 right-4 glass rounded-sm px-3 py-2 flex items-center gap-2 shadow-float">
        <StatusDot status="active" pulse />
        <div>
          <p className="overline text-on_surface" style={{ fontSize: '0.5625rem' }}>SYSTEM STATUS</p>
          <p className="text-label-sm text-secondary font-body">Data Synced Across 5 Regions</p>
        </div>
      </div>
    </div>
  );
}
