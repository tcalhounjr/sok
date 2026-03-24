import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GitBranch, Info, Lock, Plus, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { KeywordTag } from '../ui/KeywordTag';
import { Badge } from '../ui/Badge';
import { FORK_SEARCH } from '../../apollo/mutations';
import { GET_SEARCHES } from '../../apollo/queries';
import type { Search } from '../../types';

interface ForkModalProps {
  open: boolean;
  onClose: () => void;
  search: Search;
}

export function ForkModal({ open, onClose, search }: ForkModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(`${search.name} (Derivative)`);
  const [additionalParentIds, setAdditionalParentIds] = useState<string[]>([]);
  const [parentPickerQuery, setParentPickerQuery] = useState('');
  const [showParentPicker, setShowParentPicker] = useState(false);

  useEffect(() => {
    if (open) setName(`${search.name} (Derivative)`);
  }, [open, search.id, search.name]);

  // Reset additional parents when modal closes
  useEffect(() => {
    if (!open) {
      setAdditionalParentIds([]);
      setParentPickerQuery('');
      setShowParentPicker(false);
    }
  }, [open]);

  const { data: searchesData } = useQuery(GET_SEARCHES, {
    skip: !showParentPicker,
  });

  const allSearches: Search[] = searchesData?.searches ?? [];

  // Searches eligible as additional parents: not the primary parent, not already added
  const eligibleSearches = allSearches.filter(
    s => s.id !== search.id && !additionalParentIds.includes(s.id)
  );

  const filteredEligible = parentPickerQuery.trim()
    ? eligibleSearches.filter(s =>
        s.name.toLowerCase().includes(parentPickerQuery.toLowerCase())
      )
    : eligibleSearches;

  const additionalParents = allSearches.filter(s =>
    additionalParentIds.includes(s.id)
  );

  const [forkSearch, { loading }] = useMutation(FORK_SEARCH, {
    refetchQueries: [{ query: GET_SEARCHES }],
    onCompleted: d => {
      onClose();
      navigate(`/search/${d.forkSearch.id}`);
    },
  });

  function handleFork() {
    forkSearch({
      variables: {
        input: {
          parentIds: [search.id, ...additionalParentIds],
          name,
          collectionId: search.collection?.id,
        },
      },
    });
  }

  function addParent(id: string) {
    setAdditionalParentIds(prev => [...prev, id]);
    setParentPickerQuery('');
    setShowParentPicker(false);
  }

  function removeParent(id: string) {
    setAdditionalParentIds(prev => prev.filter(p => p !== id));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      overline="ACTION: FORK COLLECTION"
      title="Fork and Derivative Search"
      subtitle="Create a new curated collection based on existing intelligence parameters."
    >
      <div className="px-6 pb-6 space-y-5">
        {/* Primary parent feed */}
        <div>
          <p className="overline text-on_surface_variant mb-2">PARENT INTELLIGENCE FEED</p>
          <div className="p-4 bg-surface_container rounded-sm ghost-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-surface_container_high flex items-center justify-center">
              <GitBranch size={14} className="text-on_surface_variant" />
            </div>
            <div>
              <p className="font-display font-semibold text-on_surface text-sm">{search.name}</p>
              <p className="text-label-sm text-on_surface_variant font-body">Primary parent</p>
            </div>
          </div>

          {/* Additional parents */}
          {additionalParents.length > 0 && (
            <div className="mt-2 space-y-2">
              {additionalParents.map(p => (
                <div
                  key={p.id}
                  className="p-3 bg-surface_container rounded-sm ghost-border flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-sm bg-surface_container_high flex items-center justify-center flex-shrink-0">
                    <GitBranch size={11} className="text-on_surface_variant" />
                  </div>
                  <p className="font-display font-semibold text-on_surface text-sm flex-1">{p.name}</p>
                  <button
                    onClick={() => removeParent(p.id)}
                    className="text-on_surface_variant hover:text-error transition-colors"
                    aria-label={`Remove ${p.name} as parent`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Parent picker */}
          {showParentPicker ? (
            <div className="mt-2 bg-surface_container_high rounded-sm ghost-border overflow-hidden">
              <input
                autoFocus
                value={parentPickerQuery}
                onChange={e => setParentPickerQuery(e.target.value)}
                placeholder="Search intelligence feeds..."
                className="w-full px-3 py-2.5 bg-transparent text-body-sm text-on_surface placeholder:text-on_surface_variant focus:outline-none border-b border-surface_bright/10"
              />
              <div className="max-h-40 overflow-y-auto">
                {filteredEligible.length === 0 ? (
                  <p className="px-3 py-3 text-body-sm text-on_surface_variant font-body italic">
                    No matching searches found.
                  </p>
                ) : (
                  filteredEligible.slice(0, 20).map(s => (
                    <button
                      key={s.id}
                      onClick={() => addParent(s.id)}
                      className="w-full text-left px-3 py-2 text-body-sm text-on_surface hover:bg-surface_container transition-colors"
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
              <div className="px-3 py-2 border-t border-surface_bright/10">
                <button
                  onClick={() => { setShowParentPicker(false); setParentPickerQuery(''); }}
                  className="text-label-sm text-on_surface_variant hover:text-on_surface transition-colors font-body"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowParentPicker(true)}
              className="mt-2 flex items-center gap-1.5 text-label-sm text-on_surface_variant hover:text-primary transition-colors font-body"
            >
              <Plus size={11} />
              Add another parent
            </button>
          )}
        </div>

        {/* Derivative name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="overline text-on_surface_variant">DERIVATIVE SEARCH NAME</label>
            <span className="text-label-sm text-error font-body">Required</span>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface_container_high rounded-sm text-body-md text-on_surface ghost-border focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Inherited logic */}
        <div className="p-4 bg-surface_container rounded-sm ghost-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch size={13} className="text-on_surface_variant" />
              <p className="overline text-on_surface_variant">INHERITED INTELLIGENCE LOGIC</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-on_surface_variant" />
              <span className="text-label-sm text-on_surface_variant font-body italic">
                Configuration Locked (Read-only)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="overline text-on_surface_variant mb-2">KEYWORDS &amp; TOKENS</p>
              <div className="flex flex-wrap gap-1.5">
                {search.keywords.map(kw => (
                  <KeywordTag key={kw} label={kw} mono />
                ))}
              </div>
            </div>
            {search.filters && search.filters.length > 0 && (
              <div>
                <p className="overline text-on_surface_variant mb-2">ACTIVE CONSTRAINTS</p>
                <div className="space-y-1.5">
                  {search.filters.map(f => (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="text-body-sm text-on_surface_variant font-body">{f.type}</span>
                      <Badge variant="default">{f.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Isolation notice */}
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-sm ghost-border">
          <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-body-sm text-on_surface_variant font-body">
            Forking creates an isolated instance. Future changes to the original{' '}
            <span className="text-on_surface font-medium">{search.name}</span>{' '}
            collection will not propagate to this derivative.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button
            onClick={handleFork}
            disabled={loading || !name.trim()}
            className="btn-primary text-xs flex items-center gap-2 disabled:opacity-40"
          >
            <GitBranch size={12} />
            {loading ? 'Forking…' : 'Fork and Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
