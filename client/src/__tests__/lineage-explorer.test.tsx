/**
 * Frontend unit tests: LineageExplorer page (SOK-20)
 * Mirrors: src/pages/LineageExplorer.tsx
 *
 * Covers: loading state, empty lineage, nodes rendered by depth,
 *         node selection opening the inspector panel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseParams } = vi.hoisted(() => ({
  mockUseQuery:  vi.fn(),
  mockUseParams: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery: mockUseQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams:   () => mockUseParams(),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('../components/lineage/LineageNodeCard', () => ({
  LineageNodeCard: ({
    node,
    isSelected,
    onSelect,
  }: {
    node: { search: { id: string; name: string }; depth: number; isRoot: boolean };
    isSelected: boolean;
    onSelect: (n: any) => void;
  }) => (
    <button
      data-testid="lineage-node"
      data-selected={isSelected ? 'true' : 'false'}
      onClick={() => onSelect(node)}
    >
      {node.search.name}
    </button>
  ),
}));

vi.mock('../components/lineage/NodeInspector', () => ({
  NodeInspector: ({ node }: { node: { search: { name: string } } }) => (
    <aside data-testid="node-inspector">{node.search.name}</aside>
  ),
}));

vi.mock('../components/lineage/LineageStats', () => ({
  LineageStats: ({ lineage }: { lineage: { totalNodes: number } }) => (
    <div data-testid="lineage-stats">Total: {lineage.totalNodes}</div>
  ),
}));

import { LineageExplorer } from '../pages/LineageExplorer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_SEARCH = {
  id: 'root-search',
  name: 'Original Search',
  keywords: ['chip'],
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  parents: [],
  derivatives: [],
};

const ROOT_NODE = { search: BASE_SEARCH, depth: 0, isRoot: true };

const CHILD_NODE = {
  search: { ...BASE_SEARCH, id: 'child-search', name: 'Forked Search', parents: [{ id: 'root-search', name: 'Original Search' }] },
  depth: -1,
  isRoot: false,
};

const LINEAGE_FIXTURE = {
  root: BASE_SEARCH,
  nodes: [ROOT_NODE, CHILD_NODE],
  totalNodes: 2,
  maxDepth: 1,
  orphanCount: 0,
};

function renderPage() {
  return render(<LineageExplorer />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseParams.mockReturnValue({ id: 'root-search' });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('LineageExplorer — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
  });

  it('should render skeleton placeholders while lineage data is loading', () => {
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render any lineage node cards while loading', () => {
    renderPage();
    expect(screen.queryByTestId('lineage-node')).toBeNull();
  });
});

// ===========================================================================
// Loaded state — with nodes
// ===========================================================================

describe('LineageExplorer — loaded with lineage', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { searchLineage: LINEAGE_FIXTURE }, loading: false });
  });

  it('should render the page heading', () => {
    renderPage();
    expect(screen.getByText('Search Lineage Explorer')).toBeDefined();
  });

  it('should render a node card for each node in the lineage', () => {
    renderPage();
    const nodes = screen.getAllByTestId('lineage-node');
    expect(nodes).toHaveLength(2);
  });

  it('should render the root node name', () => {
    renderPage();
    expect(screen.getByText('Original Search')).toBeDefined();
  });

  it('should render the child node name', () => {
    renderPage();
    expect(screen.getByText('Forked Search')).toBeDefined();
  });

  it('should render the LineageStats component', () => {
    renderPage();
    expect(screen.getByTestId('lineage-stats')).toBeDefined();
    expect(screen.getByText('Total: 2')).toBeDefined();
  });

  it('should not render NodeInspector when no node is selected', () => {
    renderPage();
    expect(screen.queryByTestId('node-inspector')).toBeNull();
  });
});

// ===========================================================================
// Node selection
// ===========================================================================

describe('LineageExplorer — node selection', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { searchLineage: LINEAGE_FIXTURE }, loading: false });
  });

  it('should display the NodeInspector panel when a node is clicked', async () => {
    renderPage();
    const nodes = screen.getAllByTestId('lineage-node');
    await userEvent.click(nodes[0]);
    expect(screen.getByTestId('node-inspector')).toBeDefined();
  });

  it('should show the selected node name inside the NodeInspector', async () => {
    renderPage();
    const nodes = screen.getAllByTestId('lineage-node');
    await userEvent.click(nodes[0]);
    expect(screen.getByTestId('node-inspector').textContent).toContain('Original Search');
  });

  it('should switch the inspector to the newly clicked node', async () => {
    renderPage();
    const nodes = screen.getAllByTestId('lineage-node');
    await userEvent.click(nodes[0]);
    expect(screen.getByTestId('node-inspector').textContent).toContain('Original Search');

    await userEvent.click(nodes[1]);
    expect(screen.getByTestId('node-inspector').textContent).toContain('Forked Search');
  });
});

// ===========================================================================
// Empty lineage
// ===========================================================================

describe('LineageExplorer — empty lineage', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { searchLineage: { root: null, nodes: [], totalNodes: 0, maxDepth: 0, orphanCount: 0 } },
      loading: false,
    });
  });

  it('should render the page heading even when no nodes exist', () => {
    renderPage();
    expect(screen.getByText('Search Lineage Explorer')).toBeDefined();
  });

  it('should not render any node cards when the lineage is empty', () => {
    renderPage();
    expect(screen.queryByTestId('lineage-node')).toBeNull();
  });

  it('should render LineageStats with zero total nodes', () => {
    renderPage();
    expect(screen.getByText('Total: 0')).toBeDefined();
  });
});

// ===========================================================================
// NEO4J branding label
// ===========================================================================

describe('LineageExplorer — branding', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { searchLineage: LINEAGE_FIXTURE }, loading: false });
  });

  it('should display the NEO4J RELATIONSHIP MODEL overline', () => {
    renderPage();
    expect(screen.getByText('NEO4J RELATIONSHIP MODEL')).toBeDefined();
  });
});
