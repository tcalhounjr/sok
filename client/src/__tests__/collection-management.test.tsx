/**
 * Frontend unit tests: CollectionManagement page (SOK-21)
 * Mirrors: src/pages/CollectionManagement.tsx
 *
 * Covers: loading state, no-collections empty state, collection selected state,
 *         quick-add search, new collection form, remove search mutation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockUseQuery:    vi.fn(),
  mockUseMutation: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:    mockUseQuery,
  useMutation: mockUseMutation,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams:   () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span data-testid="status-dot" />,
}));

vi.mock('../components/collections/CollectionSidebar', () => ({
  CollectionSidebar: ({
    collections,
    loading,
    onSelect,
    onNewColToggle,
    onNewColNameChange,
    onNewColSubmit,
    newColName,
    showNewCol,
  }: {
    collections: Array<{ id: string; name: string; searches?: unknown[] }>;
    loading: boolean;
    filterInput: string;
    activeCollectionId: string | null;
    showNewCol: boolean;
    newColName: string;
    onFilterChange: (v: string) => void;
    onSelect: (id: string) => void;
    onNewColToggle: () => void;
    onNewColNameChange: (v: string) => void;
    onNewColSubmit: () => void;
    onNewColCancel: () => void;
  }) => (
    <div data-testid="collection-sidebar">
      {loading && <div data-testid="sidebar-loading">Loading...</div>}
      {collections.map(c => (
        <button key={c.id} data-testid="collection-item" onClick={() => onSelect(c.id)}>
          {c.name}
        </button>
      ))}
      <button data-testid="new-col-toggle" onClick={onNewColToggle}>New</button>
      {showNewCol && (
        <div>
          <input
            data-testid="new-col-input"
            value={newColName}
            onChange={e => onNewColNameChange(e.target.value)}
          />
          <button data-testid="new-col-submit" onClick={onNewColSubmit}>Save</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('../components/collections/CollectionSearchCard', () => ({
  CollectionSearchCard: ({
    search,
    collectionId,
    onRemove,
  }: {
    search: { id: string; name: string };
    collectionId: string;
    onRemove: (searchId: string, collId: string) => void;
  }) => (
    <div data-testid="collection-search-card">
      {search.name}
      <button data-testid={`remove-${search.id}`} onClick={() => onRemove(search.id, collectionId)}>
        Remove
      </button>
    </div>
  ),
}));

vi.mock('../components/collections/CollaboratorAvatars', () => ({
  CollaboratorAvatars: () => <div data-testid="collaborator-avatars" />,
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span />,
}));

import { CollectionManagement } from '../pages/CollectionManagement';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_FIXTURE = {
  id: 'search-1',
  name: 'Semiconductor Shift',
  keywords: ['chip'],
  status: 'active',
  filters: [],
  updatedAt: '2025-06-01T00:00:00Z',
};

const COLLECTION_FIXTURE = {
  id: 'col-1',
  name: 'Tech Watch',
  description: 'Technology monitoring',
  createdAt: '2025-01-01T00:00:00Z',
  searches: [SEARCH_FIXTURE],
};

function renderPage() {
  return render(<CollectionManagement />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('CollectionManagement — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
  });

  it('should render the CollectionSidebar in a loading state', () => {
    renderPage();
    expect(screen.getByTestId('collection-sidebar')).toBeDefined();
    expect(screen.getByTestId('sidebar-loading')).toBeDefined();
  });
});

// ===========================================================================
// Empty state — no collections
// ===========================================================================

describe('CollectionManagement — no collections', () => {
  beforeEach(() => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) return { data: { collections: [] }, loading: false };
      return { data: { searches: [] }, loading: false };
    });
  });

  it('should show the no-collection-selected empty state', () => {
    renderPage();
    expect(screen.getByText('No collection selected')).toBeDefined();
  });

  it('should render a New Collection button in the empty state', () => {
    renderPage();
    expect(screen.getByText('New Collection')).toBeDefined();
  });
});

// ===========================================================================
// Active collection selected
// ===========================================================================

describe('CollectionManagement — collection selected', () => {
  beforeEach(() => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1)
        return { data: { collections: [COLLECTION_FIXTURE] }, loading: false };
      return { data: { searches: [SEARCH_FIXTURE] }, loading: false };
    });
  });

  it('should display the active collection name', () => {
    renderPage();
    const headings = screen.getAllByText('Tech Watch');
    expect(headings.length).toBeGreaterThanOrEqual(1);
    // The h1 heading specifically should exist
    const h1 = document.querySelector('h1.font-display');
    expect(h1?.textContent).toBe('Tech Watch');
  });

  it('should render the ACTIVE COLLECTION badge', () => {
    renderPage();
    expect(screen.getByText('ACTIVE COLLECTION')).toBeDefined();
  });

  it('should render a search card for each member search', () => {
    renderPage();
    expect(screen.getByTestId('collection-search-card')).toBeDefined();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should render the QUICK-ADD SEARCH input label', () => {
    renderPage();
    expect(screen.getByText('QUICK-ADD SEARCH')).toBeDefined();
  });

  it('should render the CollaboratorAvatars component', () => {
    renderPage();
    expect(screen.getByTestId('collaborator-avatars')).toBeDefined();
  });
});

// ===========================================================================
// Remove search from collection
// ===========================================================================

describe('CollectionManagement — remove search', () => {
  const mockRemoveSearch = vi.fn();

  beforeEach(() => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1)
        return { data: { collections: [COLLECTION_FIXTURE] }, loading: false };
      return { data: { searches: [SEARCH_FIXTURE] }, loading: false };
    });
    // 3 mutations: createCollection, addSearch, removeSearch
    mockUseMutation
      .mockReturnValueOnce([vi.fn(), { loading: false }])
      .mockReturnValueOnce([vi.fn(), { loading: false }])
      .mockReturnValue([mockRemoveSearch, { loading: false }]);
  });

  it('should call removeSearchFromCollection mutation when Remove is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('remove-search-1'));
    expect(mockRemoveSearch).toHaveBeenCalledWith({
      variables: { searchId: 'search-1', collectionId: 'col-1' },
    });
  });
});

// ===========================================================================
// Quick-add search by name match
// ===========================================================================

describe('CollectionManagement — quick-add', () => {
  const mockAddSearch = vi.fn();

  beforeEach(() => {
    mockAddSearch.mockClear();
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1)
        return { data: { collections: [COLLECTION_FIXTURE] }, loading: false };
      return { data: { searches: [SEARCH_FIXTURE] }, loading: false };
    });
    // createCollection = fn[0], addSearch = fn[1], removeSearch = fn[2]
    mockUseMutation
      .mockReturnValueOnce([vi.fn(), { loading: false }])
      .mockReturnValue([mockAddSearch, { loading: false }]);
  });

  it('should call addSearchToCollection when Enter is pressed with a matching keyword', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('Enter search ID or keyword...');
    await userEvent.type(input, 'Semiconductor{Enter}');
    expect(mockAddSearch).toHaveBeenCalledWith({
      variables: { searchId: 'search-1', collectionId: 'col-1' },
    });
  });

  it('should call addSearchToCollection when Add button is clicked with a matching keyword', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('Enter search ID or keyword...');
    await userEvent.type(input, 'Semiconductor');
    await userEvent.click(screen.getByText('Add'));
    expect(mockAddSearch).toHaveBeenCalledWith({
      variables: { searchId: 'search-1', collectionId: 'col-1' },
    });
  });

  it('should not call addSearchToCollection when the search term does not match any search', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('Enter search ID or keyword...');
    // Type a term that has no keyword/ID match in the searches fixture, then click Add
    await userEvent.clear(input);
    await userEvent.type(input, 'zzz-no-match-zzz');
    await userEvent.click(screen.getByText('Add'));
    expect(mockAddSearch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// New collection form
// ===========================================================================

describe('CollectionManagement — new collection form', () => {
  const mockCreateCollection = vi.fn();

  beforeEach(() => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1)
        return { data: { collections: [] }, loading: false };
      return { data: { searches: [] }, loading: false };
    });
    mockUseMutation.mockReturnValue([mockCreateCollection, { loading: false }]);
  });

  it('should show the new collection input after toggling', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('new-col-toggle'));
    expect(screen.getByTestId('new-col-input')).toBeDefined();
  });

  it('should call createCollection mutation with typed name when submitted', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('new-col-toggle'));
    await userEvent.type(screen.getByTestId('new-col-input'), 'New Watch List');
    await userEvent.click(screen.getByTestId('new-col-submit'));
    expect(mockCreateCollection).toHaveBeenCalledWith({
      variables: { input: { name: 'New Watch List' } },
    });
  });
});
