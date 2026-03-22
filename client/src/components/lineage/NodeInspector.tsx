import { Play, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineageNode } from '../../types';

interface NodeInspectorProps {
  node: LineageNode;
}

export function NodeInspector({ node }: NodeInspectorProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 flex-shrink-0 p-5 border-l border-surface_bright/10">
      <h3 className="font-display font-semibold text-on_surface text-sm mb-4">Node Inspector</h3>

      {node.search.filters && node.search.filters.length > 0 && (
        <div className="mb-4">
          <p className="overline text-on_surface_variant mb-2">INHERITED FILTERS</p>
          <div className="space-y-2">
            {node.search.filters.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2 bg-surface_container rounded-sm ghost-border"
              >
                <span className="text-body-sm text-on_surface_variant font-body">{f.type}</span>
                <span className="text-label-sm text-on_surface font-body uppercase">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <p className="overline text-on_surface_variant mb-2">PERFORMANCE METRICS</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-surface_container rounded-sm ghost-border text-center">
            <p className="overline text-on_surface_variant mb-1">Relevance</p>
            <p className="font-display font-bold text-on_surface">94%</p>
          </div>
          <div className="p-3 bg-surface_container rounded-sm ghost-border text-center">
            <p className="overline text-on_surface_variant mb-1">Node Depth</p>
            <p className="font-display font-bold text-on_surface">Lvl {Math.abs(node.depth)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => navigate(`/search/${node.search.id}`)}
          className="w-full btn-primary text-xs flex items-center justify-center gap-2"
        >
          <Play size={11} /> Execute Search
        </button>
        <button
          onClick={() => navigate(`/search/${node.search.id}?fork=true`)}
          className="w-full btn-secondary text-xs flex items-center justify-center gap-2"
        >
          <Edit size={11} /> Fork &amp; Modify
        </button>
      </div>
    </aside>
  );
}
