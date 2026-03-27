/**
 * Frontend unit tests: FilterPresetLibrary — overflow menu (SOK-71)
 * Mirrors: src/pages/FilterPresetLibrary.tsx
 *
 * Covers: MoreVertical dropdown opens, Edit option calls openEdit,
 *         Delete option fires deleteFilterPreset mutation after confirmation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseMutation, mockDeleteFn } = vi.hoisted(() => ({
  mockUseQuery:    vi.fn(),
  mockUseMutation: vi.fn(),
  mockDeleteFn:    vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:    mockUseQuery,
  useMutation: mockUseMutation,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams:   () => ({}),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

vi.mock('../components/filters/FilterPresetModal', () => ({
  FilterPresetModal: ({
    open,
    onClose,
    preset,
  }: {
    open: boolean;
    onClose: () => void;
    preset?: { id: string; name: string } | null;
  }) =>
    open ? (
      <div data-testid="filter-preset-modal" data-preset-id={preset?.id ?? ''}>
        <button onClick={onClose} data-testid="modal-close">Close</button>
      </div>
    ) : null,
}));

vi.mock('../components/ui/QueryErrorPanel', () => ({
  QueryErrorPanel: ({ message }: { message: string }) => (
    <div role="alert">{message}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  FolderOpen:   () => <span />,
  MoreVertical: () => <span data-icon="more-vertical" />,
  Edit:         () => <span data-icon="edit" />,
  Share2:       () => <span />,
  Plus:         () => <span />,
  Trash2:       () => <span />,
  AlertTriangle: () => <span />,
}));

import { FilterPresetLibrary } from '../pages/FilterPresetLibrary';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Featured preset (most searches) — appears as the hero card, not in the grid
const PRESET_FEATURED = {
  id: 'fp-featured',
  name: 'Tier 1 Sources',
  type: 'SOURCE_TIER',
  value: '1',
  searches: [
    { id: 'search-1', name: 'Test Search' },
    { id: 'search-2', name: 'Other Search' },
  ],
};

// Grid preset — appears in the lower grid with the MoreVertical menu
const PRESET_GRID = {
  id: 'fp-grid',
  name: 'Positive Sentiment',
  type: 'SENTIMENT',
  value: 'POSITIVE',
  searches: [{ id: 'search-3', name: 'Third Search' }],
};

function setupTwoPresets() {
  mockUseQuery.mockReturnValue({
    data:    { filterPresets: [PRESET_FEATURED, PRESET_GRID] },
    loading: false,
    error:   undefined,
    refetch: vi.fn(),
  });
  mockUseMutation.mockReturnValue([mockDeleteFn, { loading: false }]);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockDeleteFn.mockReset();
  vi.restoreAllMocks();
});

// ===========================================================================
// SOK-71 — MoreVertical overflow menu
// ===========================================================================

describe('FilterPresetLibrary — overflow menu visibility', () => {
  it('should render the MoreVertical trigger button for a grid preset', () => {
    setupTwoPresets();
    render(<FilterPresetLibrary />);

    // aria-label is "Options for <name>"
    const trigger = screen.getByLabelText('Options for Positive Sentiment');
    expect(trigger).toBeDefined();
  });

  it('should not show the Edit and Delete options before the trigger is clicked', () => {
    setupTwoPresets();
    render(<FilterPresetLibrary />);

    expect(screen.queryByRole('button', { name: /^Edit$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Delete$/ })).toBeNull();
  });

  it('should open the dropdown with Edit and Delete options when MoreVertical is clicked', async () => {
    setupTwoPresets();
    render(<FilterPresetLibrary />);

    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));

    expect(screen.getByRole('button', { name: /edit/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /delete/i })).toBeDefined();
  });
});

describe('FilterPresetLibrary — overflow menu Edit action', () => {
  it('should open the FilterPresetModal with the correct preset when Edit is clicked', async () => {
    setupTwoPresets();
    render(<FilterPresetLibrary />);

    // Open dropdown
    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));
    // Click Edit
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    const modal = screen.getByTestId('filter-preset-modal');
    expect(modal).toBeDefined();
    // Modal received the preset id
    expect(modal.getAttribute('data-preset-id')).toBe('fp-grid');
  });

  it('should close the dropdown after Edit is clicked', async () => {
    setupTwoPresets();
    render(<FilterPresetLibrary />);

    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Dropdown is gone — no second Edit button visible outside modal
    expect(screen.queryByRole('button', { name: /^Delete$/ })).toBeNull();
  });
});

describe('FilterPresetLibrary — overflow menu Delete action', () => {
  it('should call deleteFilterPreset mutation with the preset id after confirmation', async () => {
    setupTwoPresets();
    // Stub window.confirm to return true (user confirms)
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FilterPresetLibrary />);

    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockDeleteFn).toHaveBeenCalledOnce();
    expect(mockDeleteFn).toHaveBeenCalledWith({ variables: { id: 'fp-grid' } });
  });

  it('should not call deleteFilterPreset when the user cancels the confirmation', async () => {
    setupTwoPresets();
    // Stub window.confirm to return false (user cancels)
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<FilterPresetLibrary />);

    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockDeleteFn).not.toHaveBeenCalled();
  });

  it('should include the number of affected searches in the confirmation message', async () => {
    setupTwoPresets();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<FilterPresetLibrary />);

    await userEvent.click(screen.getByLabelText('Options for Positive Sentiment'));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 search'),
    );
  });
});
