/**
 * Frontend unit tests: SearchLibrary page
 * Mirrors: src/pages/SearchLibrary.tsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks before any module imports
// ---------------------------------------------------------------------------

const { mockUseQuery, mockNavigate } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery: mockUseQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('../components/search/SearchCard', () => ({
  SearchCard: ({ search }: { search: { id: string; name: string } }) => (
    <div data-testid="search-card">{search.name}</div>
  ),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span data-testid="status-dot" />,
}));

vi.mock('lucide-react', () => ({
  Search: () => <span />,
  RefreshCw: () => <span />,
  SlidersHorizontal: () => <span />,
  Pin: () => <span />,
  Clock: () => <span />,
  Library: () => <span />,
  MoreVertical: () => <span />,
  Sliders: () => <span />,
  AlertTriangle: () => <span />,
  Zap: () => <span />,
}));

import { SearchLibrary } from '../pages/SearchLibrary';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_FIXTURE = {
  id: 'search-1',
  name: 'Semiconductor Shift',
  keywords: ['chip', 'fab'],
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  filters: [],
  collection: null,
  parents: [],
  derivatives: [],
};

const COLLECTION_FIXTURE = {
  id: 'col-1',
  name: 'Tech Collection',
  createdAt: '2025-01-01T00:00:00Z',
  searches: [],
};

/**
 * useQuery is called twice per render: once for GET_SEARCHES, once for
 * GET_COLLECTIONS.  We alternate responses based on call count to survive
 * re-renders (which reset React hook call order but not the mock's total count).
 * Each test group rebuilds the mock via setupQueries().
 */
function setupQueries(
  searchesResult: object,
  collectionsResult: object,
) {
  let count = 0;
  mockUseQuery.mockImplementation(() => {
    count += 1;
    return count % 2 === 1 ? searchesResult : collectionsResult;
  });
}

function renderPage() {
  return render(<SearchLibrary />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockNavigate.mockReset();
});

// ===========================================================================
// Loaded state
// ===========================================================================

describe('SearchLibrary — loaded state', () => {
  beforeEach(() => {
    setupQueries(
      { data: { searches: [SEARCH_FIXTURE] }, loading: false, error: undefined, refetch: vi.fn() },
      { data: { collections: [COLLECTION_FIXTURE] }, loading: false, error: undefined },
    );
  });

  it('should render the page heading', () => {
    renderPage();
    expect(screen.getByText('Search Library')).toBeDefined();
  });

  it('should render a search card for each returned search', () => {
    renderPage();
    expect(screen.getByTestId('search-card')).toBeDefined();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should display the TOTAL SEARCHES label in the stats panel', () => {
    renderPage();
    expect(screen.getByText('TOTAL SEARCHES')).toBeDefined();
  });

  it('should render a pinned collection name in the sidebar', () => {
    renderPage();
    expect(screen.getByText('Tech Collection')).toBeDefined();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('SearchLibrary — loading state', () => {
  beforeEach(() => {
    setupQueries(
      { data: undefined, loading: true, error: undefined, refetch: vi.fn() },
      { data: undefined, loading: true, error: undefined },
    );
  });

  it('should render skeleton placeholders while search data is loading', () => {
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render any search cards while loading', () => {
    renderPage();
    expect(screen.queryByTestId('search-card')).toBeNull();
  });
});

// ===========================================================================
// Error state
// ===========================================================================

describe('SearchLibrary — error state', () => {
  it('should render a search error alert when the searches query fails', () => {
    setupQueries(
      { data: undefined, loading: false, error: { message: 'Network error' }, refetch: vi.fn() },
      { data: undefined, loading: false, error: undefined },
    );
    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Unable to load your searches');
  });

  it('should render a collection error alert in the sidebar when collections query fails', () => {
    setupQueries(
      { data: { searches: [] }, loading: false, error: undefined, refetch: vi.fn() },
      { data: undefined, loading: false, error: { message: 'Timeout' } },
    );
    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Unable to load collections');
  });
});

// ===========================================================================
// Empty state
// ===========================================================================

describe('SearchLibrary — empty state', () => {
  beforeEach(() => {
    setupQueries(
      { data: { searches: [] }, loading: false, error: undefined, refetch: vi.fn() },
      { data: { collections: [] }, loading: false, error: undefined },
    );
  });

  it('should render the empty state message with a create link when no searches exist', () => {
    renderPage();
    expect(screen.getByText(/No searches found/)).toBeDefined();
  });

  it('should render the TOTAL SEARCHES label even when count is zero', () => {
    renderPage();
    expect(screen.getByText('TOTAL SEARCHES')).toBeDefined();
  });
});

// ===========================================================================
// Tab filtering
// ===========================================================================

describe('SearchLibrary — tab filtering', () => {
  const archivedSearch = {
    ...SEARCH_FIXTURE,
    id: 'search-2',
    name: 'Old Search',
    status: 'archived',
    derivatives: [],
  };

  beforeEach(() => {
    setupQueries(
      { data: { searches: [SEARCH_FIXTURE, archivedSearch] }, loading: false, error: undefined, refetch: vi.fn() },
      { data: { collections: [] }, loading: false, error: undefined },
    );
  });

  it('should show all searches on the All Queries tab', () => {
    renderPage();
    const cards = screen.getAllByTestId('search-card');
    expect(cards).toHaveLength(2);
  });

  it('should filter to only archived searches when Archived tab is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Archived'));
    const cards = screen.getAllByTestId('search-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toBe('Old Search');
  });

  it('should navigate to create page when create link is clicked in empty state', async () => {
    // Override with empty searches so the empty state create link appears
    setupQueries(
      { data: { searches: [] }, loading: false, error: undefined, refetch: vi.fn() },
      { data: { collections: [] }, loading: false, error: undefined },
    );
    renderPage();

    const createLink = screen.getByText(/Create one/);
    await userEvent.click(createLink);
    expect(mockNavigate).toHaveBeenCalledWith('/search/new');
  });
});
