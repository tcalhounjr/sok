import { Search, Bell, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/':           'Search Library',
  '/search':     'Search Builder',
  '/presets':    'Preset Library',
  '/lineage':    'Lineage Explorer',
  '/trends':     'Narrative Trends',
  '/collections':'Collections',
};

const tabs: Record<string, string[]> = {
  '/':        ['Analytics', 'Narratives', 'Sources', 'Collections'],
  '/presets': ['Curation Tools'],
  '/trends':  ['Search', 'Collections', 'Filters', 'Trends'],
};

export function TopNav() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const currentTabs = tabs[base] ?? [];

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-surface_container_low border-b border-surface_bright/10 flex-shrink-0">
      <div className="flex items-center gap-8">
        {/* App name */}
        <span className="font-display font-bold text-on_surface text-base tracking-tight">
          NarrativeTracker
        </span>
        {/* Tab nav */}
        {currentTabs.length > 0 && (
          <nav className="flex items-center gap-1">
            {currentTabs.map((tab, i) => (
              <button
                key={tab}
                className={`px-3 py-1 text-body-md transition-colors ${
                  i === currentTabs.length - 1
                    ? 'text-on_surface border-b-2 border-primary'
                    : 'text-on_surface_variant hover:text-on_surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on_surface_variant" />
          <input
            type="text"
            placeholder="Search library..."
            className="pl-8 pr-4 py-1.5 rounded-sm bg-surface_container text-body-sm text-on_surface placeholder:text-on_surface_variant ghost-border focus:outline-none focus:border-primary/40 w-48 transition-all"
          />
        </div>
        <button className="text-on_surface_variant hover:text-on_surface transition-colors p-1">
          <Bell size={16} />
        </button>
        <button className="text-on_surface_variant hover:text-on_surface transition-colors p-1">
          <Settings size={16} />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center">
          <span className="font-display font-bold text-on_primary text-xs">A</span>
        </div>
      </div>
    </header>
  );
}
