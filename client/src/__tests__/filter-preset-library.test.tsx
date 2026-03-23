/**
 * Frontend unit tests: FilterPresetLibrary page
 * Mirrors: src/pages/FilterPresetLibrary.tsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks before any module imports
// ---------------------------------------------------------------------------

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:    mockUseQuery,
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
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
  }: {
    open: boolean;
    onClose: () => void;
    preset?: unknown;
  }) =>
    open ? (
      <div data-testid="filter-preset-modal">
        <button onClick={onClose} data-testid="modal-close">Close</button>
      </div>
    ) : null,
}));

vi.mock('lucide-react', () => ({
  FolderOpen:   () => <span />,
  MoreVertical: () => <span />,
  Edit:         () => <span />,
  Share2:       () => <span />,
  Plus:         () => <span />,
}));

import { FilterPresetLibrary } from '../pages/FilterPresetLibrary';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRESET_FIXTURE = {
  id: 'fp-1',
  name: 'Tier 1 Sources',
  type: 'SOURCE_TIER',
  value: '1',
  searches: [{ id: 'search-1', name: 'Test Search' }],
};

const PRESET_B = {
  id: 'fp-2',
  name: 'Positive Sentiment',
  type: 'SENTIMENT',
  value: 'POSITIVE',
  searches: [],
};

function renderPage() {
  return render(<FilterPresetLibrary />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
});

// ===========================================================================
// Loaded state — single preset
// ===========================================================================

describe('FilterPresetLibrary — loaded with presets', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { filterPresets: [PRESET_FIXTURE] },
      loading: false,
      error: undefined,
    });
  });

  it('should render the page heading', () => {
    renderPage();
    expect(screen.getByText('Filter Preset Library')).toBeDefined();
  });

  it('should render the featured preset name', () => {
    renderPage();
    expect(screen.getByText('Tier 1 Sources')).toBeDefined();
  });

  it('should render the MOST ACTIVE badge on the featured preset', () => {
    renderPage();
    expect(screen.getByText('MOST ACTIVE')).toBeDefined();
  });

  it('should render the Create Preset button', () => {
    renderPage();
    expect(screen.getByText('Create Preset')).toBeDefined();
  });
});

// ===========================================================================
// Loaded state — multiple presets
// ===========================================================================

describe('FilterPresetLibrary — multiple presets', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { filterPresets: [PRESET_FIXTURE, PRESET_B] },
      loading: false,
      error: undefined,
    });
  });

  it('should render the grid of non-featured presets', () => {
    renderPage();
    expect(screen.getByText('Positive Sentiment')).toBeDefined();
  });

  it('should render feature preset first and remaining in grid', () => {
    renderPage();
    // Both names visible
    expect(screen.getByText('Tier 1 Sources')).toBeDefined();
    expect(screen.getByText('Positive Sentiment')).toBeDefined();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('FilterPresetLibrary — loading state', () => {
  it('should render skeleton placeholders while data loads', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render any preset names while loading', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderPage();
    expect(screen.queryByText('Tier 1 Sources')).toBeNull();
  });
});

// ===========================================================================
// Error state
// ===========================================================================

describe('FilterPresetLibrary — error state', () => {
  it('should render an accessible alert when the query fails', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Connection refused' },
    });

    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Failed to load filter presets');
    expect(alert.textContent).toContain('Connection refused');
  });
});

// ===========================================================================
// Empty state
// ===========================================================================

describe('FilterPresetLibrary — empty state', () => {
  it('should render the New Filter Template card when no presets exist', () => {
    mockUseQuery.mockReturnValue({
      data: { filterPresets: [] },
      loading: false,
      error: undefined,
    });

    renderPage();

    expect(screen.getByText('New Filter Template')).toBeDefined();
  });
});

// ===========================================================================
// Create Preset interaction
// ===========================================================================

describe('FilterPresetLibrary — Create Preset interaction', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { filterPresets: [PRESET_FIXTURE] },
      loading: false,
      error: undefined,
    });
  });

  it('should open the modal when Create Preset is clicked', async () => {
    renderPage();
    expect(screen.queryByTestId('filter-preset-modal')).toBeNull();

    await userEvent.click(screen.getByText('Create Preset'));

    expect(screen.getByTestId('filter-preset-modal')).toBeDefined();
  });

  it('should close the modal when the modal close callback fires', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Create Preset'));
    expect(screen.getByTestId('filter-preset-modal')).toBeDefined();

    await userEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('filter-preset-modal')).toBeNull();
  });

  it('should also open the modal when New Filter Template card is clicked', async () => {
    mockUseQuery.mockReturnValue({
      data: { filterPresets: [] },
      loading: false,
      error: undefined,
    });

    renderPage();
    expect(screen.queryByTestId('filter-preset-modal')).toBeNull();

    await userEvent.click(screen.getByText('New Filter Template'));
    expect(screen.getByTestId('filter-preset-modal')).toBeDefined();
  });
});
