import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { SearchLibrary }       from './pages/SearchLibrary';
import { SearchCreateEdit }    from './pages/SearchCreateEdit';
import { SearchDetail }        from './pages/SearchDetail';
import { LineageExplorer }     from './pages/LineageExplorer';
import { NarrativeTrends }     from './pages/NarrativeTrends';
import { FilterPresetLibrary } from './pages/FilterPresetLibrary';
import { CollectionManagement } from './pages/CollectionManagement';
import { SourceDetail }        from './pages/SourceDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Screen 1 — Search Library */}
        <Route index element={<SearchLibrary />} />

        {/* Screen 2 — Search Create / Edit */}
        <Route path="search/new"    element={<SearchCreateEdit />} />
        <Route path="search/:id/edit" element={<SearchCreateEdit />} />

        {/* Screen 3 — Search Detail & Filter Editor */}
        <Route path="search/:id" element={<SearchDetail />} />

        {/* Screen 5 — Search Lineage Explorer */}
        <Route path="lineage/:id" element={<LineageExplorer />} />

        {/* Screen 6 — Filter Preset Library */}
        <Route path="presets" element={<FilterPresetLibrary />} />

        {/* Screen 8 — Collection Management */}
        <Route path="collections"     element={<CollectionManagement />} />
        <Route path="collections/:id" element={<CollectionManagement />} />

        {/* Screen 9 — Narrative Trends */}
        <Route path="trends/:id" element={<NarrativeTrends />} />

        {/* Screen 10 — Source Detail */}
        <Route path="source/:id" element={<SourceDetail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
