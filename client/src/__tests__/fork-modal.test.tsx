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
  // useQuery is used for the parent picker (skip=true by default since showParentPicker is false)
  mockUseQuery.mockReturnValue({ data: undefined, loading: false });
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

  it('should render the INHERITED INTELLIGENCE LOGIC section label', () => {
    renderOpen();
    expect(screen.getByText('INHERITED INTELLIGENCE LOGIC')).toBeDefined();
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
  it('should render the ACTIVE CONSTRAINTS section when filters exist', () => {
    renderOpen({ search: SEARCH_WITH_FILTERS });
    expect(screen.getByText('ACTIVE CONSTRAINTS')).toBeDefined();
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
    expect(mockForkFn).toHaveBeenCalledWith({
      variables: {
        input: {
          parentIds:    ['search-1'],
          name:         'Semiconductor Shift (Derivative)',
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
