import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SEARCH_LINEAGE } from '../apollo/queries';
import { Skeleton } from '../components/ui/Skeleton';
import { LineageNodeCard } from '../components/lineage/LineageNodeCard';
import { NodeInspector } from '../components/lineage/NodeInspector';
import { LineageStats } from '../components/lineage/LineageStats';
import type { LineageNode } from '../types';

export function LineageExplorer() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useQuery(GET_SEARCH_LINEAGE, { variables: { id } });
  const [selected, setSelected] = useState<LineageNode | null>(null);

  const lineage = data?.searchLineage;

  // Group nodes by signed depth. Ancestors have positive depth (rendered above
  // the focal node), the focal node is at depth 0, and descendants have
  // negative depth (rendered below). Sort descending so ancestors appear first.
  const byDepth = new Map<number, LineageNode[]>();
  lineage?.nodes?.forEach((n: LineageNode) => {
    const d = n.depth;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n);
  });
  const depths = [...byDepth.keys()].sort((a, b) => b - a);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <p className="overline text-primary mb-1">NEO4J RELATIONSHIP MODEL</p>
          <h1 className="font-display text-headline-md text-on_surface">Search Lineage Explorer</h1>
          <p className="text-body-md text-on_surface_variant mt-1">
            Visualize the evolution of your intelligence queries. Map derivative searches, filter
            inheritance, and explore the provenance of insights.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="space-y-0">
            {depths.map((depth, di) => {
              const nodes = byDepth.get(depth) ?? [];
              return (
                <div key={depth}>
                  <div className="flex gap-4 justify-center">
                    {nodes.map((node: LineageNode, nodeIndex: number) => (
                      <LineageNodeCard
                        key={node.search.id}
                        node={node}
                        depth={depth}
                        indexInRow={nodeIndex}
                        isSelected={selected?.search.id === node.search.id}
                        onSelect={setSelected}
                        showTopConnector={di > 0}
                        showBottomConnector={di < depths.length - 1}
                      />
                    ))}
                  </div>
                  {di < depths.length - 1 && <div className="h-12" />}
                </div>
              );
            })}
          </div>
        )}

        {lineage && <LineageStats lineage={lineage} />}
      </div>

      {selected && <NodeInspector node={selected} />}
    </div>
  );
}
