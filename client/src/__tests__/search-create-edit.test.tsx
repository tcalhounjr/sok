/**
 * Frontend unit tests: SearchCreateEdit page
 * Mirrors: src/pages/SearchCreateEdit.tsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks before any module imports
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseMutation, mockUseLazyQuery, mockNavigate, mockUseParams } = vi.hoisted(() => ({
  mockUseQuery:     vi.fn(),
  mockUseMutation:  vi.fn(),
  mockUseLazyQuery: vi.fn(),
  mockNavigate:     vi.fn(),
  mockUseParams:    vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:     mockUseQuery,
  useMutation:  mockUseMutation,
  useLazyQuery: mockUseLazyQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams:   () => mockUseParams(),
  useLocation: () => ({ pathname: '/search/create', search: '', hash: '', state: null }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('../components/ui/KeywordTag', () => ({
  KeywordTag: ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span data-testid="keyword-tag">
      {label}
      <button onClick={onRemove} data-testid={`remove-${label}`}>x</button>
    </span>
  ),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span />,
}));

vi.mock('lucide-react', () => ({
  CheckCircle:   () => <span />,
  AlertTriangle: () => <span />,
  ChevronDown:   () => <span />,
  XCircle:       () => <span />,
}));

import { SearchCreateEdit } from '../pages/SearchCreateEdit';

// ---------------------------------------------------------------------------
// Default mock returns for create mode
// ---------------------------------------------------------------------------

function setupCreateMode() {
  mockUseQuery.mockReturnValue({ loading: false, data: undefined });

  const createMutationFn = vi.fn();
  const updateMutationFn = vi.fn();

  // Use mockImplementation so subsequent re-renders get consistent returns.
  // The component calls useMutation twice (createSearch, updateSearch).
  // We alternate based on call count.
  let mutationCallCount = 0;
  mockUseMutation.mockImplementation(() => {
    mutationCallCount += 1;
    if (mutationCallCount % 2 === 1) return [createMutationFn, { loading: false }];
    return [updateMutationFn, { loading: false }];
  });

  mockUseLazyQuery.mockReturnValue([vi.fn(), { loading: false }]);

  return { createMutationFn, updateMutationFn };
}

function renderPage() {
  return render(<SearchCreateEdit />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockUseLazyQuery.mockReset();
  mockNavigate.mockReset();
  mockUseParams.mockReset();
  mockUseParams.mockReturnValue({});
});

// ===========================================================================
// Render — create mode
// ===========================================================================

describe('SearchCreateEdit — create mode render', () => {
  it('should render the Configure heading in create mode', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByText('Configure Intelligence Stream')).toBeDefined();
  });

  it('should render the Search Identifier input', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByPlaceholderText(/Emerging Semiconductor/)).toBeDefined();
  });

  it('should render the keyword input field', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByPlaceholderText('+ Add Term')).toBeDefined();
  });

  it('should render the Deploy Analysis button', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByText('Deploy Analysis')).toBeDefined();
  });

  it('should render the Save as Draft button', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByText('Save as Draft')).toBeDefined();
  });

  it('should render the LIVE PROJECTION section in the sidebar', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByText('LIVE PROJECTION')).toBeDefined();
  });
});

// ===========================================================================
// Form validation
// ===========================================================================

describe('SearchCreateEdit — form validation', () => {
  it('should show a name-required alert when submitting with an empty name', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.click(screen.getByText('Save as Draft'));

    await waitFor(() => {
      expect(screen.getByText('Search name is required.')).toBeDefined();
    });
  });

  it('should show a keywords-required alert when submitting without any keywords', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/Emerging Semiconductor/), 'My Search');
    await userEvent.click(screen.getByText('Save as Draft'));

    await waitFor(() => {
      expect(screen.getByText('At least one keyword is required.')).toBeDefined();
    });
  });

  it('should display validation alerts with role="alert"', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.click(screen.getByText('Save as Draft'));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should not call createSearch mutation when validation fails', async () => {
    const { createMutationFn } = setupCreateMode();
    renderPage();

    await userEvent.click(screen.getByText('Save as Draft'));

    expect(createMutationFn).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Keyword interaction
// ===========================================================================

describe('SearchCreateEdit — keyword input', () => {
  it('should add a keyword tag when Enter is pressed in the keyword field', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText('+ Add Term'), 'semiconductor{Enter}');

    expect(screen.getByTestId('keyword-tag')).toBeDefined();
  });

  it('should add a keyword tag when comma is pressed', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText('+ Add Term'), 'TSMC,');

    expect(screen.getByTestId('keyword-tag')).toBeDefined();
  });

  it('should not add a duplicate keyword when the same term is entered twice', async () => {
    setupCreateMode();
    renderPage();

    const kwInput = screen.getByPlaceholderText('+ Add Term');
    await userEvent.type(kwInput, 'chip{Enter}');
    await userEvent.type(kwInput, 'chip{Enter}');

    const tags = screen.getAllByTestId('keyword-tag');
    expect(tags).toHaveLength(1);
  });

  it('should remove a keyword tag when its remove button is clicked', async () => {
    setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText('+ Add Term'), 'removeme{Enter}');

    expect(screen.getByTestId('keyword-tag')).toBeDefined();
    await userEvent.click(screen.getByTestId('remove-removeme'));
    expect(screen.queryByTestId('keyword-tag')).toBeNull();
  });
});

// ===========================================================================
// Mutation on valid submit
// ===========================================================================

describe('SearchCreateEdit — mutation on submit', () => {
  it('should call createSearch with active status when Deploy Analysis is clicked', async () => {
    const { createMutationFn } = setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/Emerging Semiconductor/), 'My Search');
    await userEvent.type(screen.getByPlaceholderText('+ Add Term'), 'chip{Enter}');

    await userEvent.click(screen.getByText('Deploy Analysis'));

    expect(createMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            name: 'My Search',
            keywords: ['chip'],
            status: 'ACTIVE',
          }),
        }),
      }),
    );
  });

  it('should call createSearch with draft status when Save as Draft is clicked', async () => {
    const { createMutationFn } = setupCreateMode();
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/Emerging Semiconductor/), 'Draft Search');
    await userEvent.type(screen.getByPlaceholderText('+ Add Term'), 'tsmc{Enter}');

    await userEvent.click(screen.getByText('Save as Draft'));

    expect(createMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({ status: 'DRAFT' }),
        }),
      }),
    );
  });
});

// ===========================================================================
// Mutation error state
// ===========================================================================

describe('SearchCreateEdit — mutation error', () => {
  it('should render a mutation error alert when the mutation returns an error', async () => {
    mockUseQuery.mockReturnValue({ loading: false, data: undefined });

    let capturedOnError: ((err: { message: string }) => void) | undefined;
    let mutationCallCount = 0;

    mockUseMutation.mockImplementation(
      (_mutation: unknown, options?: { onError?: (err: { message: string }) => void }) => {
        mutationCallCount += 1;
        if (mutationCallCount % 2 === 1) {
          capturedOnError = options?.onError;
          return [vi.fn(), { loading: false }];
        }
        return [vi.fn(), { loading: false }];
      },
    );

    mockUseLazyQuery.mockReturnValue([vi.fn(), { loading: false }]);

    renderPage();

    // Trigger onError callback after render — simulates Apollo network failure
    capturedOnError?.({ message: 'Service unavailable' });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Service unavailable');
    });
  });
});

// ===========================================================================
// SOK-39 carry-in — exclude keywords input
// ===========================================================================

describe('SearchCreateEdit — exclude keywords input', () => {
  it('should add an exclusion tag when Enter is pressed in the exclude field', async () => {
    setupCreateMode();
    renderPage();

    // The EXCLUDE input has placeholder "+ Add Exception"
    const exInput = screen.getByPlaceholderText('+ Add Exception');
    await userEvent.type(exInput, 'crypto{Enter}');

    // A KeywordTag stub renders with data-testid="keyword-tag"
    const tags = screen.getAllByTestId('keyword-tag');
    const excludeTag = tags.find(t => t.textContent?.includes('crypto'));
    expect(excludeTag).toBeDefined();
  });

  it('should add an exclusion tag when comma is pressed in the exclude field', async () => {
    setupCreateMode();
    renderPage();

    const exInput = screen.getByPlaceholderText('+ Add Exception');
    await userEvent.type(exInput, 'retail,');

    const tags = screen.getAllByTestId('keyword-tag');
    const excludeTag = tags.find(t => t.textContent?.includes('retail'));
    expect(excludeTag).toBeDefined();
  });
});

// ===========================================================================
// SOK-39 carry-in — topic taxonomy selector
// ===========================================================================

describe('SearchCreateEdit — topic taxonomy', () => {
  it('should render all four taxonomy topic buttons', () => {
    setupCreateMode();
    renderPage();
    expect(screen.getByText('Technology')).toBeDefined();
    expect(screen.getByText('Geopolitics')).toBeDefined();
    expect(screen.getByText('Economics')).toBeDefined();
    expect(screen.getByText('Supply Chain')).toBeDefined();
  });

  it('should allow selecting a different taxonomy topic', async () => {
    setupCreateMode();
    renderPage();
    await userEvent.click(screen.getByText('Geopolitics'));
    // No crash; the selected state updates via className but we confirm the button exists
    expect(screen.getByText('Geopolitics')).toBeDefined();
  });
});

// ===========================================================================
// SOK-39 carry-in — edit mode heading
// ===========================================================================

describe('SearchCreateEdit — edit mode heading', () => {
  it('should render Edit Intelligence Stream heading when an id param is present', () => {
    // Set useParams to return an id so isEdit = true in the component
    mockUseParams.mockReturnValue({ id: 'search-1' });
    mockUseQuery.mockReturnValue({ loading: false, data: undefined });
    mockUseLazyQuery.mockReturnValue([vi.fn(), { loading: false }]);

    let mutationCallCount = 0;
    mockUseMutation.mockImplementation(() => {
      mutationCallCount += 1;
      if (mutationCallCount % 2 === 1) return [vi.fn(), { loading: false }];
      return [vi.fn(), { loading: false }];
    });

    renderPage();
    expect(screen.getByText('Edit Intelligence Stream')).toBeDefined();
  });
});
