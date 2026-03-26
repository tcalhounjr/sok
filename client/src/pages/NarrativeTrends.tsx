import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_NARRATIVE_TRENDS } from '../apollo/queries';
import { StatusDot } from '../components/ui/StatusDot';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { QueryErrorPanel } from '../components/ui/QueryErrorPanel';
import { VolumeChart } from '../components/trends/VolumeChart';
import { SentimentBreakdown } from '../components/trends/SentimentBreakdown';
import { TopicCloud } from '../components/trends/TopicCloud';
import { SourceRankings } from '../components/trends/SourceRankings';
import { NarrativeShiftCard } from '../components/trends/NarrativeShiftCard';
import type { NarrativeShift } from '../types';

const INTERVALS = ['L7D', 'L30D', 'L90D'] as const;

export function NarrativeTrends() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interval, setIntervalVal] = useState('L7D');
  const sourceRankingsRef = useRef<HTMLDivElement | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_NARRATIVE_TRENDS, {
    variables: { searchId: id, interval },
    skip: !id,
  });

  const trends = data?.narrativeTrends;

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <aside className="w-44 flex-shrink-0 p-5 border-r border-surface_bright/10">
        <div className="space-y-0.5">
          {[
            {
              label: 'RECENT',
              active: true,
              onClick: undefined,
            },
            {
              label: 'LINEAGE',
              active: false,
              onClick: id ? () => navigate(`/lineage/${id}`) : undefined,
            },
            {
              label: 'SOURCES',
              active: false,
              onClick: () => sourceRankingsRef.current?.scrollIntoView({ behavior: 'smooth' }),
            },
          ].map(({ label, active, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`w-full text-left px-3 py-2 rounded-sm text-body-sm font-body transition-colors flex items-center gap-2 ${
                active
                  ? 'text-on_surface border-l-2 border-secondary pl-2.5'
                  : 'text-on_surface_variant hover:text-on_surface'
              }`}
            >
              {active && <StatusDot status="active" />}
              {label}
            </button>
          ))}
        </div>
        <div className="mt-8 space-y-0.5">
          <button className="w-full text-left px-3 py-2 text-body-sm text-on_surface_variant font-body hover:text-on_surface transition-colors">ARCHIVE</button>
          <button className="w-full text-left px-3 py-2 text-body-sm text-on_surface_variant font-body hover:text-on_surface transition-colors">HELP</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Badge variant="neutral" className="mb-2">CURRENT NARRATIVE</Badge>
            {loading
              ? <Skeleton className="h-10 w-80 mb-2" />
              : <h1 className="font-display font-bold text-headline-lg text-on_surface leading-tight mb-2">
                  {trends?.searchName ?? 'Narrative Trends'}
                </h1>
            }
            <p className="text-body-md text-on_surface_variant max-w-xl">
              Detailed analytical view of media volume, sentiment trends, and source distribution for the trailing period.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex rounded-sm ghost-border overflow-hidden">
              {INTERVALS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setIntervalVal(opt)}
                  className={`px-2.5 py-1.5 text-label-sm font-body transition-colors ${
                    interval === opt ? 'bg-surface_container_high text-on_surface' : 'text-on_surface_variant hover:text-on_surface'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <QueryErrorPanel
            message="Unable to load trend data. Check your connection and try again."
            onRetry={refetch}
          />
        ) : (
          <>
            {/* Charts row */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div className="col-span-2">
                <VolumeChart data={trends?.volumeOverTime ?? []} loading={loading} />
              </div>
              <SentimentBreakdown data={trends?.sentimentBreakdown ?? null} loading={loading} />
            </div>

            {/* Topics + Sources row */}
            <div className="grid grid-cols-2 gap-5 mb-5" ref={sourceRankingsRef}>
              <TopicCloud topics={trends?.topTopics ?? []} loading={loading} />
              <SourceRankings
                sources={trends?.topSources ?? []}
                totalArticles={trends?.totalArticles ?? 0}
                loading={loading}
              />
            </div>

            {/* Recent Narrative Shifts */}
            <div>
              <h3 className="font-display font-semibold text-on_surface text-sm mb-4">
                Recent Narrative Shifts
              </h3>
              {(trends?.narrativeShifts ?? []).length === 0 && !loading ? (
                <p className="text-body-sm text-on_surface_variant font-body">
                  No significant shifts detected in this period.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {(trends?.narrativeShifts ?? []).map((shift: NarrativeShift, i: number) => (
                    <NarrativeShiftCard key={i} {...shift} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
