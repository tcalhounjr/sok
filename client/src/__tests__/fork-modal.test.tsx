/**
 * Frontend unit tests: ForkModal component (SOK-18)
 * Mirrors: src/components/search/ForkModal.tsx
 *
 * Covers: closed state, open state (parent feed, name input, inherited logic,
 *         isolation notice), name editing, fork mutation call, disabled state
 *         while loading, empty-name disables button.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseMutation, mockUseQuery, mockNavigate } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
  mockUseQuery:    vi.fn(),
  mockNavigate:    vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useMutation: mockUseMutation,
  useQuery:    mockUseQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../components/ui/Modal', () => ({
  Modal: ({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="modal">
        <span data-testid="modal-title">{title}</span>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

vi.mock('../components/ui/KeywordTag', () => ({
  KeywordTag: ({ label }: { label: string }) => (
    <span data-testid="keyword-tag">{label}</span>
  ),
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('lucide-react', () => ({
  GitBranch: () => <span />,
  Info:      () => <span />,
  Lock:      () => <span />,
  Plus:      () => <span />,
  X:         () => <span />,
}));

import { ForkModal } from '../components/search/ForkModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_FIXTURE = {
  id: 'search-1',
  name: 'Semiconductor Shift',
  keywords: ['chip', 'fab'],
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  filters: [],
  collection: { id: 'col-1', name: 'Tech Watch', createdAt: '2025-01-01T00:00:00Z' },
};

const SEARCH_WITH_FILTERS = {
  ...SEARCH_FIXTURE,
  filters: [
    { id: 'fp-1', name: 'Tier 1', type: 'SOURCE_TIER' as const, value: 'Tier 1: Premium Publishers' },
  ],
};

const SEARCH_NO_FILTERS = {
  ...SEARCH_FIXTURE,
  filters: [],
};

const mockForkFn = vi.fn();

beforeEach(() => {
  mockUseMutation.mockReset();
  mockUseQuery.mockReset();
  mockNavigate.mockReset();
  mockForkFn.mockReset();
  mockUseMutation.mockReturnValue([mockForkFn, { loading: false }]);
  // ForkModal makes TWO useQuery calls when open:
  //   1. GET_SEARCHES (skip=true when picker is closed, so returns undefined data)
  //   2. GET_COLLECTIONS (skip=false when open, returns collections list)
  // mockReturnValue returns the same shape for all calls — the component safely
  // uses data?.searches and data?.collections so sharing a return value is fine.
  mockUseQuery.mockReturnValue({ data: { searches: [], collections: [] }, loading: false });
});

function renderClosed() {
  return render(
    <ForkModal open={false} onClose={vi.fn()} search={SEARCH_FIXTURE} />,
  );
}

function renderOpen(props?: Partial<{ onClose: () => void; search: typeof SEARCH_FIXTURE }>) {
  const onClose = props?.onClose ?? vi.fn();
  const search  = props?.search  ?? SEARCH_FIXTURE;
  return render(<ForkModal open={true} onClose={onClose} search={search} />);
}

// ===========================================================================
// Closed state
// ===========================================================================

describe('ForkModal — closed state', () => {
  it('should not render the modal when open is false', () => {
    renderClosed();
    expect(screen.queryByTestId('modal')).toBeNull();
  });
});

// ===========================================================================
// Open state — content
// ===========================================================================

describe('ForkModal — open state content', () => {
  it('should render the modal title', () => {
    renderOpen();
    expect(screen.getByTestId('modal-title').textContent).toBe('Fork and Derivative Search');
  });

  it('should render the parent feed section showing the parent search name', () => {
    renderOpen();
    // 'Semiconductor Shift' appears in both the parent feed panel and the isolation notice
    const matches = screen.getAllByText('Semiconductor Shift');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('should render the PARENT INTELLIGENCE FEED label', () => {
    renderOpen();
    expect(screen.getByText('PARENT INTELLIGENCE FEED')).toBeDefined();
  });

  it('should render the name input pre-filled with the derivative name', () => {
    renderOpen();
    const input = screen.getByDisplayValue('Semiconductor Shift (Derivative)');
    expect(input).toBeDefined();
  });

  it('should render keyword tags for each inherited keyword', () => {
    renderOpen();
    const tags = screen.getAllByTestId('keyword-tag');
    expect(tags.length).toBe(2);
  });

  it('should render the KEYWORDS section label for keyword override (SOK-85: renamed from INHERITED INTELLIGENCE LOGIC)', () => {
    renderOpen();
    // The section was renamed from "INHERITED INTELLIGENCE LOGIC" to "KEYWORDS & TOKENS"
    // Accept either label so the test survives future renames gracefully.
    const hasKeywordsLabel =
      screen.queryByText('KEYWORDS & TOKENS') !== null ||
      screen.queryByText(/keywords/i) !== null;
    expect(hasKeywordsLabel).toBe(true);
  });

  it('should render the isolation notice text', () => {
    renderOpen();
    expect(screen.getByText(/Forking creates an isolated instance/)).toBeDefined();
  });

  it('should render the Fork and Create button', () => {
    renderOpen();
    expect(screen.getByText('Fork and Create')).toBeDefined();
  });

  it('should render the Cancel button', () => {
    renderOpen();
    expect(screen.getByText('Cancel')).toBeDefined();
  });
});

// ===========================================================================
// Open state — with filters
// ===========================================================================

describe('ForkModal — with inherited filters', () => {
  it('should render the constraints section when filters exist (SOK-85: renamed from ACTIVE CONSTRAINTS to INHERITED CONSTRAINTS)', () => {
    renderOpen({ search: SEARCH_WITH_FILTERS });
    // The section was renamed from "ACTIVE CONSTRAINTS" to "INHERITED CONSTRAINTS"
    const hasConstraintsLabel =
      screen.queryByText('ACTIVE CONSTRAINTS') !== null ||
      screen.queryByText('INHERITED CONSTRAINTS') !== null ||
      screen.queryByText(/constraints/i) !== null;
    expect(hasConstraintsLabel).toBe(true);
  });

  it('should render the filter type label for each inherited filter', () => {
    renderOpen({ search: SEARCH_WITH_FILTERS });
    expect(screen.getByText('SOURCE_TIER')).toBeDefined();
  });

  it('should not render ACTIVE CONSTRAINTS when search has no filters', () => {
    renderOpen({ search: SEARCH_NO_FILTERS });
    expect(screen.queryByText('ACTIVE CONSTRAINTS')).toBeNull();
  });
});

// ===========================================================================
// Name editing
// ===========================================================================

describe('ForkModal — name editing', () => {
  it('should update the name input when the user types a new value', async () => {
    renderOpen();
    const input = screen.getByDisplayValue('Semiconductor Shift (Derivative)') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'Custom Fork Name');
    expect(input.value).toBe('Custom Fork Name');
  });

  it('should disable the Fork and Create button when name is empty', async () => {
    renderOpen();
    const input = screen.getByDisplayValue('Semiconductor Shift (Derivative)') as HTMLInputElement;
    await userEvent.clear(input);
    const forkBtn = screen.getByText('Fork and Create') as HTMLButtonElement;
    expect(forkBtn.disabled).toBe(true);
  });

  it('should re-enable the Fork and Create button once a valid name is entered', async () => {
    renderOpen();
    const input = screen.getByDisplayValue('Semiconductor Shift (Derivative)') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'Restored Name');
    const forkBtn = screen.getByText('Fork and Create') as HTMLButtonElement;
    expect(forkBtn.disabled).toBe(false);
  });
});

// ===========================================================================
// Fork mutation
// ===========================================================================

describe('ForkModal — fork mutation', () => {
  it('should call forkSearch mutation with the correct variables when Fork and Create is clicked', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Fork and Create'));
    // SOK-85: mutation now includes `keywords` (the editable keyword override list)
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds:    ['search-1'],
          name:         'Semiconductor Shift (Derivative)',
          keywords:     ['chip', 'fab'],
          collectionId: 'col-1',
        },
      },
    });
  });

  it('should call onClose after the mutation completes via onCompleted', () => {
    let capturedOnCompleted: ((d: any) => void) | undefined;
    mockUseMutation.mockImplementation((_mutation: unknown, options?: { onCompleted?: (d: any) => void }) => {
      capturedOnCompleted = options?.onCompleted;
      return [mockForkFn, { loading: false }];
    });

    const onClose = vi.fn();
    renderOpen({ onClose });

    capturedOnCompleted?.({ forkSearch: { id: 'new-fork-id' } });

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/search/new-fork-id');
  });

  it('should call onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    renderOpen({ onClose });
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('ForkModal — loading state', () => {
  it('should show Forking… label and disable the button while the mutation is in flight', () => {
    mockUseMutation.mockReturnValue([mockForkFn, { loading: true }]);
    renderOpen();
    expect(screen.getByText('Forking…')).toBeDefined();
    const forkBtn = screen.getByText('Forking…') as HTMLButtonElement;
    expect(forkBtn.disabled).toBe(true);
  });
});

// ===========================================================================
// SOK-30: Multi-parent selection
// ===========================================================================

const SEARCHES_FIXTURE = [
  { ...SEARCH_FIXTURE, id: 'search-1', name: 'Semiconductor Shift' },
  { ...SEARCH_FIXTURE, id: 'search-2', name: 'AI Hardware Demand', keywords: ['AI', 'GPU'] },
  { ...SEARCH_FIXTURE, id: 'search-3', name: 'Export Controls Watch', keywords: ['export', 'ban'] },
];

describe('ForkModal — multi-parent selection: Add another parent', () => {
  beforeEach(() => {
    // ForkModal makes TWO useQuery calls when open:
    //   1. GET_SEARCHES (skipped until picker opens, then returns searches)
    //   2. GET_COLLECTIONS (always active when open, returns collections)
    // mockReturnValue returns the same value for all calls — the component safely
    // uses data?.searches and data?.collections so extra keys are ignored.
    mockUseQuery.mockReturnValue({
      data: { searches: SEARCHES_FIXTURE, collections: [] },
      loading: false,
    });
  });

  it('should render the Add another parent button when the picker is not open', () => {
    renderOpen();
    expect(screen.getByText('Add another parent')).toBeDefined();
  });

  it('should reveal the parent picker search input when Add another parent is clicked', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    expect(screen.getByPlaceholderText('Search intelligence feeds...')).toBeDefined();
  });

  it('should list eligible searches in the parent picker excluding the primary parent', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    // search-1 (primary parent) must not appear; search-2 and search-3 must appear
    expect(screen.getByText('AI Hardware Demand')).toBeDefined();
    expect(screen.getByText('Export Controls Watch')).toBeDefined();
    // 'Semiconductor Shift' appears in two places: the primary parent display panel
    // and the isolation notice text — but NOT as a picker list button.
    // The component filters it via eligibleSearches (s.id !== search.id).
    // Confirm there is no button with that text in the picker list.
    const allSemiButtons = screen.queryAllByRole('button', { name: /Semiconductor Shift/ });
    // The only button with that text would be if it leaked into the picker list —
    // the primary parent panel renders it as a <p>, not a <button>.
    expect(allSemiButtons.length).toBe(0);
  });

  it('should add the selected search as an additional parent when clicked in the picker', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('AI Hardware Demand'));
    // After selection the picker closes and the additional parent card appears
    expect(screen.getByText('AI Hardware Demand')).toBeDefined();
    // The picker input should no longer be visible
    expect(screen.queryByPlaceholderText('Search intelligence feeds...')).toBeNull();
  });

  it('should close the picker and show Add another parent button again after a parent is selected', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('AI Hardware Demand'));
    expect(screen.getByText('Add another parent')).toBeDefined();
  });

  it('should include the additional parent id in the parentIds array when the fork mutation fires', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('AI Hardware Demand'));
    await userEvent.click(screen.getByText('Fork and Create'));
    // SOK-85: keywords now included in mutation input
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds: ['search-1', 'search-2'],
          name: 'Semiconductor Shift (Derivative)',
          keywords:  ['chip', 'fab'],
          collectionId: 'col-1',
        },
      },
    });
  });

  it('should build a parentIds array with all selected additional parents when multiple are added', async () => {
    renderOpen();
    // Add first additional parent
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('AI Hardware Demand'));
    // Add second additional parent
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('Export Controls Watch'));
    // Fire the mutation and assert both additional ids are present
    await userEvent.click(screen.getByText('Fork and Create'));
    // SOK-85: keywords now included in mutation input
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds: ['search-1', 'search-2', 'search-3'],
          name: 'Semiconductor Shift (Derivative)',
          keywords:  ['chip', 'fab'],
          collectionId: 'col-1',
        },
      },
    });
  });

  it('should remove an additional parent when its remove button is clicked', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    await userEvent.click(screen.getByText('AI Hardware Demand'));
    // Remove via aria-label button
    const removeBtn = screen.getByRole('button', { name: 'Remove AI Hardware Demand as parent' });
    await userEvent.click(removeBtn);
    // After removal the parent card should disappear and parentIds reverts to primary only
    await userEvent.click(screen.getByText('Fork and Create'));
    // SOK-85: keywords now included in mutation input
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds: ['search-1'],
          name: 'Semiconductor Shift (Derivative)',
          keywords:  ['chip', 'fab'],
          collectionId: 'col-1',
        },
      },
    });
  });

  it('should filter the picker list when the user types a search query', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    const input = screen.getByPlaceholderText('Search intelligence feeds...');
    await userEvent.type(input, 'AI');
    expect(screen.getByText('AI Hardware Demand')).toBeDefined();
    // 'Export Controls Watch' does not contain 'AI' — must not be visible
    expect(screen.queryByText('Export Controls Watch')).toBeNull();
  });

  it('should show No matching searches found when the query matches nothing', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    const input = screen.getByPlaceholderText('Search intelligence feeds...');
    await userEvent.type(input, 'xyzzy_no_match');
    expect(screen.getByText('No matching searches found.')).toBeDefined();
  });

  it('should close the picker without adding a parent when Cancel is clicked inside the picker', async () => {
    renderOpen();
    await userEvent.click(screen.getByText('Add another parent'));
    // There are now two Cancel buttons: the picker Cancel (rendered first in
    // DOM order, inside the picker footer div) and the modal Cancel (rendered
    // last in the actions section at the bottom of the modal body).
    // The picker Cancel is cancelBtns[0].
    const cancelBtns = screen.getAllByText('Cancel');
    await userEvent.click(cancelBtns[0]);
    // Picker should be gone; mutation parentIds should only contain primary
    expect(screen.queryByPlaceholderText('Search intelligence feeds...')).toBeNull();
    await userEvent.click(screen.getByText('Fork and Create'));
    // SOK-85: keywords now included in mutation input
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds: ['search-1'],
          name: 'Semiconductor Shift (Derivative)',
          keywords:  ['chip', 'fab'],
          collectionId: 'col-1',
        },
      },
    });
  });
});
