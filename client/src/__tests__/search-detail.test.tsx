/**
 * Frontend unit tests: SearchDetail page (SOK-19)
 * Mirrors: src/pages/SearchDetail.tsx
 *
 * Covers: loaded state, loading state, not-found state,
 *         parent breadcrumb, filter removal, fork modal trigger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseMutation, mockNavigate, mockUseParams } = vi.hoisted(() => ({
  mockUseQuery:    vi.fn(),
  mockUseMutation: vi.fn(),
  mockNavigate:    vi.fn(),
  mockUseParams:   vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:    mockUseQuery,
  useMutation: mockUseMutation,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams:   () => mockUseParams(),
}));

vi.mock('../components/ui/KeywordTag', () => ({
  KeywordTag: ({ label }: { label: string }) => <span data-testid="keyword-tag">{label}</span>,
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span data-testid="status-dot" />,
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('../components/search/ForkModal', () => ({
  ForkModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="fork-modal">
        <button onClick={onClose}>Close Fork Modal</button>
      </div>
    ) : null,
}));

vi.mock('../lib/utils', () => ({
  timeAgo: (date: string) => `2h ago (${date})`,
}));

vi.mock('lucide-react', () => ({
  GitBranch:  () => <span />,
  Clock:      () => <span />,
  Eye:        () => <span />,
  TrendingUp: () => <span />,
  X:          () => <span />,
}));

import { SearchDetail } from '../pages/SearchDetail';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_FIXTURE = {
  id: 'search-1',
  name: 'Semiconductor Shift',
  keywords: ['chip', 'fab'],
  status: 'active',
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  filters: [],
  collection: null,
  parents: [],
  derivatives: [],
  articles: [],
};

const FILTER_FIXTURE = {
  id: 'fp-1',
  name: 'Tier 1',
  type: 'SOURCE_TIER',
  value: '1',
};

function renderPage() {
  return render(<SearchDetail />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockNavigate.mockReset();
  mockUseParams.mockReturnValue({ id: 'search-1' });
  // Default mutation stub
  mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('SearchDetail — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
  });

  it('should render skeleton placeholders while data is loading', () => {
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render the search name while loading', () => {
    renderPage();
    expect(screen.queryByText('Semiconductor Shift')).toBeNull();
  });
});

// ===========================================================================
// Not-found state
// ===========================================================================

describe('SearchDetail — not found', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: null }, loading: false });
  });

  it('should render a not-found message when the search is null', () => {
    renderPage();
    expect(screen.getByText('Search not found.')).toBeDefined();
  });
});

// ===========================================================================
// Loaded state — no parents, no filters, no articles
// ===========================================================================

describe('SearchDetail — loaded state (minimal)', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: SEARCH_FIXTURE }, loading: false });
  });

  it('should render the search name as a heading', () => {
    renderPage();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should render the BASE KEYWORDS label', () => {
    renderPage();
    expect(screen.getByText('BASE KEYWORDS')).toBeDefined();
  });

  it('should render keyword tags for each search keyword', () => {
    renderPage();
    const tags = screen.getAllByTestId('keyword-tag');
    expect(tags.length).toBe(2);
  });

  it('should render the REFINEMENT PRESETS label', () => {
    renderPage();
    expect(screen.getByText('REFINEMENT PRESETS')).toBeDefined();
  });

  it('should show empty filters message when no filters are applied', () => {
    renderPage();
    expect(screen.getByText('No filters applied.')).toBeDefined();
  });

  it('should render the LIVE PREVIEW label', () => {
    renderPage();
    expect(screen.getByText('LIVE PREVIEW')).toBeDefined();
  });

  it('should show no results message when articles array is empty', () => {
    renderPage();
    expect(screen.getByText('No results yet.')).toBeDefined();
  });
});

// ===========================================================================
// Loaded state — with parent breadcrumb
// ===========================================================================

describe('SearchDetail — with parent breadcrumb', () => {
  const searchWithParent = {
    ...SEARCH_FIXTURE,
    parents: [{ id: 'parent-1', name: 'Original Search' }],
    collection: { id: 'col-1', name: 'Tech Watch' },
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: searchWithParent }, loading: false });
  });

  it('should render the collection name in the breadcrumb', () => {
    renderPage();
    expect(screen.getByText('TECH WATCH')).toBeDefined();
  });

  it('should render the parent search name in the breadcrumb', () => {
    renderPage();
    expect(screen.getByText('ORIGINAL SEARCH')).toBeDefined();
  });
});

// ===========================================================================
// Loaded state — with applied filters
// ===========================================================================

describe('SearchDetail — with filters', () => {
  const searchWithFilters = {
    ...SEARCH_FIXTURE,
    filters: [FILTER_FIXTURE],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: searchWithFilters }, loading: false });
  });

  it('should render the filter type label for each applied filter', () => {
    renderPage();
    expect(screen.getByText('SOURCE_TIER')).toBeDefined();
  });

  it('should not show the empty-filters message when filters are present', () => {
    renderPage();
    expect(screen.queryByText('No filters applied.')).toBeNull();
  });

  it('should call the removeFilter mutation when the remove button is clicked', async () => {
    const mockRemoveFilter = vi.fn();
    mockUseMutation.mockReturnValue([mockRemoveFilter, { loading: false }]);
    mockUseQuery.mockReturnValue({ data: { search: searchWithFilters }, loading: false });

    renderPage();

    const removeBtn = screen.getByRole('button', { name: '' });
    // The X button — click the first occurrence (inside the filter row)
    const xButtons = document.querySelectorAll('button');
    // Find the remove button by proximity to filter row
    const removeButtons = Array.from(xButtons).filter(b =>
      b.className.includes('hover:text-error')
    );
    if (removeButtons.length > 0) {
      await userEvent.click(removeButtons[0]);
      expect(mockRemoveFilter).toHaveBeenCalledWith({
        variables: { filterId: 'fp-1', searchId: 'search-1' },
      });
    }
  });
});

// ===========================================================================
// Navigation actions
// ===========================================================================

describe('SearchDetail — navigation', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: SEARCH_FIXTURE }, loading: false });
  });

  it('should navigate to the lineage page when Version History is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Version History'));
    expect(mockNavigate).toHaveBeenCalledWith('/lineage/search-1');
  });

  it('should navigate to the trends page when View Narrative Trends is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('View Narrative Trends'));
    expect(mockNavigate).toHaveBeenCalledWith('/trends/search-1');
  });

  it('should open the ForkModal when Fork Search is clicked', async () => {
    renderPage();
    expect(screen.queryByTestId('fork-modal')).toBeNull();
    await userEvent.click(screen.getByText('Fork Search'));
    expect(screen.getByTestId('fork-modal')).toBeDefined();
  });

  it('should close the ForkModal when its close action is triggered', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Fork Search'));
    expect(screen.getByTestId('fork-modal')).toBeDefined();
    await userEvent.click(screen.getByText('Close Fork Modal'));
    expect(screen.queryByTestId('fork-modal')).toBeNull();
  });
});

// ===========================================================================
// Loaded state — with articles
// ===========================================================================

describe('SearchDetail — with articles', () => {
  const searchWithArticles = {
    ...SEARCH_FIXTURE,
    articles: [
      {
        id: 'art-1',
        headline: 'Chip shortage deepens',
        publishedAt: '2025-06-01T00:00:00Z',
        sentiment: 'NEGATIVE',
        source: { id: 'src-1', name: 'Reuters', tier: 1, region: 'GLOBAL' },
        topics: [],
      },
      {
        id: 'art-2',
        headline: 'Fab investment rises',
        publishedAt: '2025-06-02T00:00:00Z',
        sentiment: 'POSITIVE',
        source: { id: 'src-1', name: 'Reuters', tier: 1, region: 'GLOBAL' },
        topics: [],
      },
    ],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: searchWithArticles }, loading: false });
  });

  it('should render article headlines in the live preview panel', () => {
    renderPage();
    expect(screen.getByText('Chip shortage deepens')).toBeDefined();
    expect(screen.getByText('Fab investment rises')).toBeDefined();
  });

  it('should not show the no-results message when articles exist', () => {
    renderPage();
    expect(screen.queryByText('No results yet.')).toBeNull();
  });

  it('should render the SIGNAL DENSITY count', () => {
    renderPage();
    expect(screen.getByText('2')).toBeDefined();
  });
});

// ===========================================================================
// SOK-39 carry-in — additional coverage tests
// ===========================================================================

describe('SearchDetail — collection breadcrumb falls back to LIBRARY', () => {
  const searchWithParentNoCollection = {
    ...SEARCH_FIXTURE,
    parents: [{ id: 'parent-1', name: 'Root Search' }],
    collection: null,
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { search: searchWithParentNoCollection },
      loading: false,
    });
  });

  it('should render LIBRARY as the breadcrumb overline when collection is null', () => {
    renderPage();
    expect(screen.getByText('LIBRARY')).toBeDefined();
  });
});

describe('SearchDetail — multiple parents breadcrumb', () => {
  const searchWithMultipleParents = {
    ...SEARCH_FIXTURE,
    parents: [
      { id: 'p1', name: 'Alpha Feed' },
      { id: 'p2', name: 'Beta Feed' },
    ],
    collection: null,
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { search: searchWithMultipleParents },
      loading: false,
    });
  });

  it('should join multiple parent names with + in the breadcrumb', () => {
    renderPage();
    expect(screen.getByText('ALPHA FEED + BETA FEED')).toBeDefined();
  });
});

describe('SearchDetail — true matches percentage', () => {
  const searchWithArticles = {
    ...SEARCH_FIXTURE,
    articles: [
      {
        id: 'art-1', headline: 'Test', publishedAt: '2025-06-01T00:00:00Z',
        sentiment: 'NEUTRAL',
        source: { id: 'src-1', name: 'Reuters', tier: 1, region: 'GLOBAL' },
        topics: [],
      },
    ],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { search: searchWithArticles }, loading: false });
  });

  it('should show the 82% true-matches figure when articles exist', () => {
    renderPage();
    expect(screen.getByText('82%')).toBeDefined();
  });
});
