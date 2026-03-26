import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, SlidersHorizontal, Pin, Clock, Library } from 'lucide-react';
import { GET_SEARCHES, GET_COLLECTIONS } from '../apollo/queries';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { SearchCard } from '../components/search/SearchCard';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusDot } from '../components/ui/StatusDot';
import { QueryErrorPanel } from '../components/ui/QueryErrorPanel';
import type { Search as SearchType, Collection } from '../types';

const TABS = ['All Queries', 'High Priority', 'Archived'] as const;
type Tab = typeof TABS[number];

export function SearchLibrary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('All Queries');
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([{ label: 'Dashboard', path: '/' }]);
  }, [setCrumbs]);

  const { data: searchData, loading: searchLoading, error: searchError, refetch } = useQuery(GET_SEARCHES);
  const { data: collectionData, error: collectionError } = useQuery(GET_COLLECTIONS);

  const searches: SearchType[] = searchData?.searches ?? [];
  const collections: Collection[] = collectionData?.collections ?? [];

  const filtered = searches.filter(s => {
    if (activeTab === 'Archived')      return s.status === 'archived';
    if (activeTab === 'High Priority') return (s.derivatives?.length ?? 0) > 0;
    return true;
  });

  const totalSearches     = searches.length;
  const activeCollections = collections.length;
  const newToday = searches.filter(s =>
    Date.now() - new Date(s.updatedAt).getTime() < 86400000
  ).length;

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="overline text-on_surface_variant mb-1">WORKSPACE / INTELLIGENCE</p>
            <h1 className="font-display text-headline-md text-on_surface">Search Library</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2 text-xs">
              <SlidersHorizontal size={12} /> Bulk Actions
            </button>
            <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2 text-xs">
              <RefreshCw size={12} /> Refresh All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'TOTAL SEARCHES',     value: totalSearches,    sub: '+12%', icon: Search,   pulse: false, accent: 'border-primary'   },
            { label: 'ACTIVE COLLECTIONS', value: activeCollections, sub: `Across ${Math.min(collections.length, 8)} Regions`, icon: Library, pulse: false, accent: 'border-secondary'  },
            { label: 'NEW RESULTS TODAY',  value: newToday,         sub: '',     icon: null,     pulse: true,  accent: 'border-tertiary'  },
          ].map(({ label, value, sub, icon: Icon, pulse, accent }) => (
            <div key={label} className={`bg-surface_container_low p-5 rounded-lg border-l-2 ${accent} flex items-center justify-between relative overflow-hidden`}>
              <div className="relative z-10">
                <p className="overline text-on_surface_variant mb-1">{label}</p>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-headline-sm text-on_surface">
                    {value.toLocaleString()}
                  </span>
                  {sub && <span className="text-label-sm text-on_surface_variant font-body">{sub}</span>}
                  {pulse && <StatusDot status="active" pulse />}
                </div>
              </div>
              {Icon && <Icon size={64} className="absolute right-[-8px] bottom-[-8px] text-on_surface/5 pointer-events-none" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 mb-4 border-b border-surface_bright/10 pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-body-md font-body transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-on_surface border-primary'
                  : 'text-on_surface_variant border-transparent hover:text-on_surface'
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-3">
            <span className="overline text-on_surface_variant">SORT BY:</span>
            <span className="text-label-sm text-on_surface font-body uppercase tracking-widest">Last Updated</span>
          </div>
        </div>

        {searchError ? (
          <div className="mt-4">
            <QueryErrorPanel
              message="Unable to load your searches. Check your connection and try again."
              onRetry={refetch}
            />
          </div>
        ) : searchLoading ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {filtered.map(s => <SearchCard key={s.id} search={s} />)}
            {filtered.length === 0 && (
              <div className="col-span-2 py-16 text-center text-on_surface_variant text-body-md font-body">
                No searches found.{' '}
                <button onClick={() => navigate('/search/new')} className="text-primary hover:underline">
                  Create one →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="w-64 flex-shrink-0 p-6 border-l border-surface_bright/10 space-y-6">
        <div>
          <p className="overline text-on_surface_variant mb-3 flex items-center gap-1.5">
            <Pin size={10} /> PINNED COLLECTIONS
          </p>
          <div className="space-y-2">
            {collectionError ? (
              <p role="alert" className="text-label-sm text-error font-body">
                Unable to load collections.
              </p>
            ) : collections.slice(0, 3).map(col => (
              <button
                key={col.id}
                onClick={() => navigate(`/collections/${col.id}`)}
                className="w-full text-left px-3 py-2 rounded-sm hover:bg-surface_container transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status="active" />
                  <span className="text-body-sm text-on_surface font-body truncate">{col.name}</span>
                </div>
                <p className="text-label-sm text-on_surface_variant font-body mt-0.5 pl-4">
                  {col.searches?.length ?? 0} Active Queries
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="overline text-on_surface_variant mb-3 flex items-center gap-1.5">
            <Clock size={10} /> RECENT INTELLIGENCE
          </p>
          <div className="space-y-3">
            {[
              { text: 'System updated Semiconductor Shift feed with 142 new sources.', time: '2 mins ago', alert: false },
              { text: 'Anomaly detected in CBDC Regulation sentiment pattern.',         time: '45 mins ago', alert: true  },
              { text: 'Analyst shared the EU Tech Strategy report.',                    time: '3 hours ago', alert: false },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5">
                <span className={`text-xs mt-0.5 flex-shrink-0 ${item.alert ? 'text-error' : 'text-secondary'}`}>
                  {item.alert ? '▲' : '●'}
                </span>
                <div>
                  <p className="text-body-sm text-on_surface font-body leading-snug">{item.text}</p>
                  <p className="text-label-sm text-on_surface_variant font-body mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="overline text-on_surface_variant mb-3">API UTILIZATION</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-label-sm font-body">
              <span className="text-on_surface_variant">64,000 / 100k queries</span>
              <span className="text-on_surface">64%</span>
            </div>
            <div className="h-1 bg-surface_container_high rounded-full overflow-hidden">
              <div className="h-full w-[64%] bg-primary/60 rounded-full" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
