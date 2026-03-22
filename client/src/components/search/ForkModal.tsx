import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { GitBranch, Info, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { KeywordTag } from '../ui/KeywordTag';
import { Badge } from '../ui/Badge';
import { FORK_SEARCH } from '../../apollo/mutations';
import { GET_SEARCHES } from '../../apollo/queries';
import { Search } from '../../types';

interface ForkModalProps {
  open: boolean;
  onClose: () => void;
  search: Search;
}

export function ForkModal({ open, onClose, search }: ForkModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(`${search.name} (Derivative)`);

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
          parentIds: [search.id],
          name,
          collectionId: search.collection?.id,
        },
      },
    });
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
        {/* Parent feed */}
        <div className="p-4 bg-surface_container rounded-sm ghost-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-surface_container_high flex items-center justify-center">
            <GitBranch size={14} className="text-on_surface_variant" />
          </div>
          <div>
            <p className="overline text-on_surface_variant mb-0.5">PARENT INTELLIGENCE FEED</p>
            <p className="font-display font-semibold text-on_surface text-sm">{search.name}</p>
          </div>
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
