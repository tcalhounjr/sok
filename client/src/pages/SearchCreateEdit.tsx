import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { CheckCircle, AlertTriangle, ChevronDown, XCircle } from 'lucide-react';
import { CREATE_SEARCH, UPDATE_SEARCH } from '../apollo/mutations';
import { GET_SEARCH, GET_SEARCHES } from '../apollo/queries';
import { useVolumeProjection } from '../hooks/useVolumeProjection';
import { KeywordTag } from '../components/ui/KeywordTag';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusDot } from '../components/ui/StatusDot';

const TOPIC_TAXONOMY = [
  { label: 'Technology'   },
  { label: 'Geopolitics'  },
  { label: 'Economics'    },
  { label: 'Supply Chain' },
];

export function SearchCreateEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [name, setName]           = useState('');
  const [keywords, setKeywords]   = useState<string[]>([]);
  const [excludes, setExcludes]   = useState<string[]>([]);
  const [kwInput, setKwInput]     = useState('');
  const [exInput, setExInput]     = useState('');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate]     = useState('2025-12-31');
  const [topic, setTopic]         = useState('Technology');

  const { loading: loadingExisting } = useQuery(GET_SEARCH, {
    variables: { id },
    skip: !isEdit,
    onCompleted: d => {
      if (d?.search) {
        setName(d.search.name);
        setKeywords(d.search.keywords ?? []);
        setStartDate(d.search.startDate ?? '');
        setEndDate(d.search.endDate ?? '');
      }
    },
  });

  const { projection, loading: projLoading } = useVolumeProjection(keywords);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const [createSearch, { loading: creating }] = useMutation(CREATE_SEARCH, {
    refetchQueries: [{ query: GET_SEARCHES }],
    onCompleted: d => navigate(`/search/${d.createSearch.id}`),
    onError: err => setMutationError(err.message),
  });

  const [updateSearch, { loading: updating }] = useMutation(UPDATE_SEARCH, {
    refetchQueries: [{ query: GET_SEARCHES }],
    onCompleted: () => navigate(`/search/${id}`),
    onError: err => setMutationError(err.message),
  });

  const loading = creating || updating || loadingExisting;

  const [touched, setTouched] = useState(false);
  const nameInvalid     = touched && !name.trim();
  const keywordsInvalid = touched && keywords.length === 0;

  function addKeyword() {
    const trimmed = kwInput.trim().replace(/^["']|["']$/g, '');
    if (trimmed && !keywords.includes(trimmed)) setKeywords(prev => [...prev, trimmed]);
    setKwInput('');
  }

  function handleSubmit(deploy: boolean) {
    setTouched(true);
    setMutationError(null);
    if (!name.trim() || keywords.length === 0) return;
    const input = { name, keywords, startDate, endDate, status: deploy ? 'ACTIVE' : 'DRAFT' };
    if (isEdit) {
      updateSearch({ variables: { id, input } });
    } else {
      createSearch({ variables: { input } });
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <p className="overline text-on_surface_variant mb-1">ANALYTICAL WORKSPACE</p>
          <h1 className="font-display text-headline-md text-on_surface">
            {isEdit ? 'Edit Intelligence Stream' : 'Configure Intelligence Stream'}
          </h1>
          <p className="text-body-md text-on_surface_variant mt-1">
            Define complex Boolean parameters and entity relationships to isolate key narratives across global media channels.
          </p>
        </div>

        {mutationError && (
          <div role="alert" className="max-w-2xl mb-5 p-3 rounded-sm bg-error/10 ghost-border flex items-start gap-2">
            <XCircle size={14} className="text-error mt-0.5 flex-shrink-0" />
            <p className="text-body-sm text-error font-body">{mutationError}</p>
          </div>
        )}

        <div className="space-y-5 max-w-2xl">
          {/* Section 1: Identity */}
          <div className="card p-6">
            <p className="overline text-primary mb-4">1. IDENTITY &amp; CONTEXT</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="overline text-on_surface_variant block mb-1.5">Search Identifier</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-invalid={nameInvalid}
                  placeholder="e.g. Emerging Semiconductor Narrative 2025"
                  className={`w-full px-3 py-2.5 bg-surface_container_high rounded-sm text-body-md text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none focus:border-primary/40 transition-colors ${nameInvalid ? 'border-error/50' : ''}`}
                />
                {nameInvalid && (
                  <p role="alert" className="text-label-sm text-error font-body mt-1">Search name is required.</p>
                )}
              </div>
              <div>
                <label className="overline text-on_surface_variant block mb-1.5">Temporal Scope</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface_container_high rounded-sm text-body-sm text-on_surface ghost-border focus:outline-none" />
                  <span className="text-on_surface_variant">—</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface_container_high rounded-sm text-body-sm text-on_surface ghost-border focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="overline text-on_surface_variant block mb-1.5">Refinement Level</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-surface_container_high rounded-sm ghost-border">
                  <CheckCircle size={13} className="text-secondary" />
                  <span className="text-body-sm text-on_surface">High Precision Mode</span>
                  <ChevronDown size={13} className="ml-auto text-on_surface_variant" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Keywords */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="overline text-primary">2. LOGICAL OPERATORS &amp; KEYWORDS</p>
              <button className="text-label-sm text-secondary font-body hover:underline">
                &lt;/&gt; Advanced Syntax
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="overline text-on_surface_variant mb-2">INCLUDE:</p>
                <div className={`min-h-12 p-3 bg-surface_container_high rounded-sm ghost-border flex flex-wrap gap-2 ${keywordsInvalid ? 'border-error/50' : ''}`}>
                  {keywords.map(kw => (
                    <KeywordTag key={kw} label={kw} onRemove={() => setKeywords(prev => prev.filter(k => k !== kw))} />
                  ))}
                  <input
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); } }}
                    placeholder="+ Add Term"
                    className="bg-transparent text-body-sm text-secondary placeholder:text-on_surface_variant focus:outline-none min-w-24"
                  />
                </div>
                {keywordsInvalid && (
                  <p role="alert" className="text-label-sm text-error font-body mt-1">At least one keyword is required.</p>
                )}
              </div>
              <div>
                <p className="overline text-on_surface_variant mb-2">EXCLUDE:</p>
                <div className="min-h-10 p-3 bg-surface_container_high rounded-sm ghost-border flex flex-wrap gap-2">
                  {excludes.map(ex => (
                    <KeywordTag key={ex} label={ex} onRemove={() => setExcludes(prev => prev.filter(e => e !== ex))} className="text-error" />
                  ))}
                  <input
                    value={exInput}
                    onChange={e => setExInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const t = exInput.trim();
                        if (t) { setExcludes(prev => [...prev, t]); setExInput(''); }
                      }
                    }}
                    placeholder="+ Add Exception"
                    className="bg-transparent text-body-sm text-on_surface_variant placeholder:text-on_surface_variant focus:outline-none min-w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Taxonomy */}
          <div className="card p-6">
            <p className="overline text-primary mb-4">3. TOPIC TAXONOMY</p>
            <div className="grid grid-cols-4 gap-3">
              {TOPIC_TAXONOMY.map(({ label }) => (
                <button
                  key={label}
                  onClick={() => setTopic(label)}
                  className={`p-4 rounded-sm text-center transition-colors ${
                    topic === label
                      ? 'bg-surface_container_high ghost-border border-primary/30'
                      : 'bg-surface_container hover:bg-surface_container_high ghost-border'
                  }`}
                >
                  <div className={`text-xl mb-2 ${topic === label ? 'text-secondary' : 'text-on_surface_variant'}`}>⬡</div>
                  <p className="text-label-sm font-body text-on_surface">{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <StatusDot status="active" pulse />
              <span className="text-label-sm text-secondary font-body">142ms Real-time</span>
            </div>
            <span className="text-label-sm text-on_surface_variant font-body">API COST EST. $0.04 / 1k Hits</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSubmit(false)} disabled={loading} className="btn-secondary text-xs disabled:opacity-40">
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading || !name || keywords.length === 0}
              className="btn-primary text-xs disabled:opacity-40"
            >
              {loading ? 'Deploying…' : 'Deploy Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Projection Rail — DD-2 */}
      <aside className="w-64 flex-shrink-0 p-6 border-l border-surface_bright/10">
        <div className="flex items-center gap-1.5 mb-4">
          <StatusDot status="active" pulse />
          <p className="overline text-secondary">LIVE PROJECTION</p>
        </div>
        <div className="mb-4">
          <p className="overline text-on_surface_variant mb-1">ESTIMATED VOLUME</p>
          {projLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-headline-md text-on_surface">
                {projection?.estimatedVolume?.toLocaleString() ?? '—'}
              </span>
              {projection && projection.estimatedVolume > 0 && (
                <span className="text-secondary text-label-sm font-body">+12%</span>
              )}
            </div>
          )}
          <p className="text-label-sm text-on_surface_variant font-body mt-1">EST. VOLUME (SEED CORPUS)</p>
        </div>

        <div className="flex items-end gap-0.5 h-8 mb-4">
          {[40, 55, 70, 60, 100, 80, 65].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i === 4 ? 'bg-secondary' : 'bg-surface_container_high'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {projection?.topSources && projection.topSources.length > 0 && (
          <div className="mb-4">
            <p className="overline text-on_surface_variant mb-2 flex items-center justify-between">
              TOP SOURCES
              <span className="w-1.5 h-1.5 rounded-full bg-on_surface_variant" />
            </p>
            <div className="space-y-1.5">
              {projection.topSources.slice(0, 3).map(({ source, count }) => (
                <div key={source.id} className="flex items-center justify-between">
                  <span className="text-body-sm text-on_surface font-body truncate">{source.name}</span>
                  <span className="text-label-sm text-on_surface_variant font-body ml-2 flex-shrink-0">
                    {Math.round((count / (projection.estimatedVolume || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="p-3 bg-tertiary/5 rounded-sm ghost-border mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-tertiary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-label-sm font-body text-on_surface font-medium">Precision Alert</p>
                <p className="text-label-sm font-body text-on_surface_variant mt-0.5">
                  Your keywords may capture generalized data. Consider adding geopolitical filters.
                </p>
              </div>
            </div>
          </div>
        )}

        <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
          Run Validation Test →
        </button>
      </aside>
    </div>
  );
}
