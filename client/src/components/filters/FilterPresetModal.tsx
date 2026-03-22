import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { SlidersHorizontal, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { KeywordTag } from '../ui/KeywordTag';
import { CREATE_FILTER_PRESET, UPDATE_FILTER_PRESET, DELETE_FILTER_PRESET } from '../../apollo/mutations';
import { GET_FILTER_PRESETS, GET_SEARCHES } from '../../apollo/queries';
import { FilterPreset } from '../../types';

const FILTER_TYPES = ['SOURCE_TIER','SENTIMENT','REGION','LANGUAGE','DATE_RANGE'] as const;
const OPERATORS = ['Include Exactly','Exclude','Must Contain','At Least One Of'] as const;

const TYPE_VALUES: Record<string, string[]> = {
  SOURCE_TIER: ['Tier 1: Premium Publishers','Tier 2: Specialized Tech','US: East Coast Hubs','UK: Broadsheets'],
  SENTIMENT:   ['POSITIVE','NEUTRAL','NEGATIVE'],
  REGION:      ['US','UK','EU','APAC','GLOBAL'],
  LANGUAGE:    ['en','de','fr','ja','zh'],
  DATE_RANGE:  ['Last 7 days','Last 30 days','Last 90 days','Custom'],
};

interface FilterPresetModalProps {
  open: boolean;
  onClose: () => void;
  preset?: FilterPreset | null;
}

export function FilterPresetModal({ open, onClose, preset }: FilterPresetModalProps) {
  const isEdit = Boolean(preset);
  const [name, setName]         = useState('');
  const [type, setType]         = useState<typeof FILTER_TYPES[number]>('SOURCE_TIER');
  const [operator, setOperator] = useState<typeof OPERATORS[number]>('Include Exactly');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: searchData } = useQuery(GET_SEARCHES);
  const affectedCount = searchData?.searches?.length ?? 0;

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setType(preset.type);
      setSelected([preset.value]);
    } else {
      setName(''); setType('SOURCE_TIER'); setSelected([]);
    }
  }, [preset, open]);

  const refetchQueries = [{ query: GET_FILTER_PRESETS }];

  const [createPreset, { loading: creating }] = useMutation(CREATE_FILTER_PRESET, {
    refetchQueries, onCompleted: onClose,
  });
  const [updatePreset, { loading: updating }] = useMutation(UPDATE_FILTER_PRESET, {
    refetchQueries, onCompleted: onClose,
  });
  const [deletePreset, { loading: deleting }] = useMutation(DELETE_FILTER_PRESET, {
    refetchQueries, onCompleted: onClose,
  });

  const loading = creating || updating || deleting;

  function handleSave() {
    const value = selected.join(',');
    if (isEdit && preset) {
      updatePreset({ variables: { id: preset.id, input: { name, type, value } } });
    } else {
      createPreset({ variables: { input: { name, type, value } } });
    }
  }

  function toggleValue(v: string) {
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  const projectedReduction = Math.round((selected.length / Math.max(TYPE_VALUES[type].length, 1)) * 65);

  return (
    <Modal
      open={open}
      onClose={onClose}
      overline="CONFIGURATION SUITE"
      title="Filter Preset Engine"
      subtitle="Define cross-collection logic for unified intelligence stream."
    >
      <div className="px-6 pb-6 space-y-5">
        {/* Preset name */}
        <div>
          <label className="overline text-on_surface_variant block mb-1.5">PRESET NAME</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Tier 1 US Sources"
            className="w-full px-3 py-2.5 bg-surface_container_high rounded-sm text-body-md text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none"
          />
        </div>

        {/* Type + Operator */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="overline text-on_surface_variant block mb-1.5">FILTER TYPE</label>
            <div className="relative">
              <select
                value={type}
                onChange={e => { setType(e.target.value as any); setSelected([]); }}
                className="w-full px-3 py-2.5 bg-surface_container_high rounded-sm text-body-md text-on_surface ghost-border focus:outline-none appearance-none"
              >
                {FILTER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="overline text-on_surface_variant block mb-1.5">TARGET OPERATOR</label>
            <select
              value={operator}
              onChange={e => setOperator(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-surface_container_high rounded-sm text-body-md text-on_surface ghost-border focus:outline-none appearance-none"
            >
              {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Selected values */}
        <div>
          <label className="overline text-on_surface_variant block mb-2">SELECTED VALUES</label>
          <div className="p-3 bg-surface_container_high rounded-sm ghost-border min-h-12 flex flex-wrap gap-2">
            {selected.map(v => (
              <KeywordTag key={v} label={v} onRemove={() => toggleValue(v)} mono={false} />
            ))}
            <div className="flex flex-wrap gap-2 mt-1">
              {TYPE_VALUES[type].filter(v => !selected.includes(v)).map(v => (
                <button
                  key={v}
                  onClick={() => toggleValue(v)}
                  className="text-label-sm text-on_surface_variant font-body hover:text-primary transition-colors"
                >
                  + {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Impact preview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface_container rounded-sm ghost-border">
            <p className="overline text-on_tertiary_container mb-2">IMPACT PREVIEW</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display font-bold text-headline-md text-on_surface">{affectedCount}</span>
              <span className="text-body-sm text-on_surface_variant font-body">Searches</span>
            </div>
            <p className="text-body-sm text-on_surface_variant font-body">
              This filter will be automatically synchronized with {affectedCount} active monitoring searches.
            </p>
          </div>
          <div className="p-4 bg-surface_container rounded-sm ghost-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-body-sm text-on_surface font-body">Projected Data Reduction</p>
              <span className="text-secondary font-body font-medium">{projectedReduction}%</span>
            </div>
            <div className="h-1.5 bg-surface_container_high rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${projectedReduction}%` }}
              />
            </div>
            <p className="text-label-sm text-on_surface_variant font-body">
              Calculated based on 30-day historical data volume.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div>
            {isEdit && (
              <button
                onClick={() => preset && deletePreset({ variables: { id: preset.id } })}
                disabled={loading}
                className="flex items-center gap-2 text-label-sm text-error font-body hover:opacity-80 transition-opacity"
              >
                <Trash2 size={12} /> Discard Preset
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim() || selected.length === 0}
              className="btn-primary text-xs flex items-center gap-2 disabled:opacity-40"
            >
              <SlidersHorizontal size={11} />
              {loading ? 'Saving…' : 'Save Preset Logic'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
