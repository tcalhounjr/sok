import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { FolderOpen, MoreVertical, Edit, Share2, Plus } from 'lucide-react';
import { GET_FILTER_PRESETS } from '../apollo/queries';
import type { FilterPreset } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { FilterPresetModal } from '../components/filters/FilterPresetModal';

const TYPE_ICONS: Record<string, string> = {
  SOURCE_TIER: '▤',
  SENTIMENT:   '◉',
  REGION:      '◎',
  LANGUAGE:    '⊞',
  DATE_RANGE:  '◷',
};

const TYPE_LABELS: Record<string, string> = {
  SOURCE_TIER: 'Source List',
  SENTIMENT:   'Sentiment',
  REGION:      'Geofence',
  LANGUAGE:    'Language',
  DATE_RANGE:  'Temporal',
};

export function FilterPresetLibrary() {
  const { data, loading, error } = useQuery(GET_FILTER_PRESETS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FilterPreset | null>(null);

  const presets: FilterPreset[] = data?.filterPresets ?? [];
  const sorted = [...presets].sort((a, b) => (b.searches?.length ?? 0) - (a.searches?.length ?? 0));

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(p: FilterPreset) { setEditing(p); setModalOpen(true); }

  const [featured, ...rest] = sorted;

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="overline text-on_surface_variant mb-1">CURATION TOOLS</p>
            <h1 className="font-display text-headline-md text-on_surface">Filter Preset Library</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2 text-xs">
              <FolderOpen size={12} /> Manage Folders
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-xs">
              <Plus size={12} /> Create Preset
            </button>
          </div>
        </div>

        {error ? (
          <div role="alert" className="p-4 rounded-sm bg-error/10 ghost-border text-error text-body-sm font-body">
            Failed to load filter presets: {error.message}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured — most active */}
            {featured && (
              <div className="card p-6 relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="active">MOST ACTIVE</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-surface_container_high flex items-center justify-center text-xl text-on_surface_variant flex-shrink-0">
                    {TYPE_ICONS[featured.type]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-on_surface text-base mb-1">{featured.name}</h3>
                    <p className="text-body-md text-on_surface_variant font-body">
                      {featured.type === 'SOURCE_TIER' && 'Exclusive filtering for high-authority journalism.'}
                      {featured.type === 'SENTIMENT'   && `Aggregates content with ${featured.value} sentiment scores.`}
                      {featured.type === 'REGION'      && `Filters results to the ${featured.value} region.`}
                      {featured.type === 'LANGUAGE'    && `Restricts results to ${featured.value} language sources.`}
                      {featured.type === 'DATE_RANGE'  && 'Applies a fixed temporal window to results.'}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="overline text-on_surface_variant mb-0.5">USAGE</p>
                          <p className="font-display font-semibold text-on_surface">
                            {featured.searches?.length ?? 0} <span className="text-body-sm font-body text-on_surface_variant">searches</span>
                          </p>
                        </div>
                        <div>
                          <p className="overline text-on_surface_variant mb-0.5">TYPE</p>
                          <p className="text-secondary text-body-sm font-body">{TYPE_LABELS[featured.type]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(featured)} className="text-on_surface_variant hover:text-on_surface transition-colors p-1">
                          <Edit size={14} />
                        </button>
                        <button className="text-on_surface_variant hover:text-on_surface transition-colors p-1">
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rest — grid */}
            <div className="grid grid-cols-3 gap-4">
              {rest.map(preset => (
                <div key={preset.id} className="card p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-sm bg-surface_container_high flex items-center justify-center text-lg text-on_surface_variant">
                      {TYPE_ICONS[preset.type]}
                    </div>
                    <button className="text-on_surface_variant opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h3 className="font-display font-semibold text-on_surface text-sm mb-1.5">{preset.name}</h3>
                  <p className="text-body-sm text-on_surface_variant font-body mb-4 line-clamp-2">
                    {preset.type === 'SENTIMENT'  && `Filters content to ${preset.value} sentiment only.`}
                    {preset.type === 'REGION'     && `Restricts to ${preset.value} region sources.`}
                    {preset.type === 'LANGUAGE'   && `${preset.value.toUpperCase()} language sources only.`}
                    {preset.type === 'DATE_RANGE' && 'Custom temporal window filter.'}
                    {preset.type === 'SOURCE_TIER'&& `Tier ${preset.value} sources.`}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-label-sm text-on_surface_variant font-body">
                      {preset.searches?.length ?? 0} USES
                    </p>
                    <Badge variant="default">{TYPE_LABELS[preset.type]}</Badge>
                  </div>
                </div>
              ))}

              {/* New template card */}
              <button
                onClick={openCreate}
                className="card p-5 flex flex-col items-center justify-center gap-3 hover:bg-surface_container_high transition-colors ghost-border border-dashed"
              >
                <div className="w-9 h-9 rounded-sm bg-surface_container_high flex items-center justify-center">
                  <Plus size={16} className="text-on_surface_variant" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm text-on_surface font-body font-medium">New Filter Template</p>
                  <p className="text-label-sm text-on_surface_variant font-body mt-0.5">Define logic once, reuse across all analytical streams.</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <FilterPresetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        preset={editing}
      />
    </>
  );
}
