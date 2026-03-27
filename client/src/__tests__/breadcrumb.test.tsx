/**
 * Frontend unit tests: BreadcrumbBar component (SOK-88)
 * Mirrors: src/components/layout/BreadcrumbBar.tsx
 *
 * Covers:
 * - BreadcrumbBar renders nothing when crumbs.length <= 1
 * - BreadcrumbBar renders the crumb trail when crumbs.length > 1
 * - Each crumb except the last is a clickable button
 * - Clicking a crumb navigates to its path
 * - Last crumb is not interactive (current page indicator)
 *
 * BreadcrumbBar reads crumbs from BreadcrumbContext via useBreadcrumb().
 * Tests wrap the component in the real BreadcrumbProvider and drive crumb
 * state via a helper component that calls setCrumbs() on mount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams:   () => ({}),
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} data-testid="breadcrumb-link" data-to={to}>
      {children}
    </a>
  ),
}));

// Override the global setup.ts mock for BreadcrumbContext so these tests
// use the REAL implementation (we need state to drive the component).
vi.mock('../context/BreadcrumbContext', async () => {
  const actual = await vi.importActual<typeof import('../context/BreadcrumbContext')>(
    '../context/BreadcrumbContext',
  );
  return actual;
});

import { BreadcrumbProvider, useBreadcrumb } from '../context/BreadcrumbContext';
import { BreadcrumbBar } from '../components/layout/BreadcrumbBar';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Crumb { label: string; path: string; }

const SINGLE_CRUMB: Crumb[] = [
  { label: 'Semiconductor Shift', path: '/search/search-1' },
];

const TWO_CRUMBS: Crumb[] = [
  { label: 'Tech Watch',          path: '/collections/col-1' },
  { label: 'Semiconductor Shift', path: '/search/search-1' },
];

const THREE_CRUMBS: Crumb[] = [
  { label: 'Collections',         path: '/collections' },
  { label: 'Tech Watch',          path: '/collections/col-1' },
  { label: 'Semiconductor Shift', path: '/search/search-1' },
];

// Helper: renders BreadcrumbBar inside BreadcrumbProvider with a specific crumb set.
// A child component sets crumbs via setCrumbs() on mount.
function CrumbSetter({ crumbs }: { crumbs: Crumb[] }) {
  const { setCrumbs } = useBreadcrumb();
  React.useEffect(() => { setCrumbs(crumbs); }, [crumbs, setCrumbs]);
  return null;
}

function renderBar(crumbs: Crumb[]) {
  return render(
    <BreadcrumbProvider>
      <CrumbSetter crumbs={crumbs} />
      <BreadcrumbBar />
    </BreadcrumbProvider>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
});

// ===========================================================================
// SOK-88 — Renders nothing when crumbs.length <= 1
// ===========================================================================

describe('BreadcrumbBar — SOK-88: hidden with 0 or 1 crumb', () => {
  it('should render nothing when crumbs is an empty array', () => {
    const { container } = renderBar([]);
    // With 0 crumbs the component returns null → nav element must not exist
    expect(container.querySelector('nav')).toBeNull();
  });

  it('should render nothing when there is only one crumb', () => {
    const { container } = renderBar(SINGLE_CRUMB);
    expect(container.querySelector('nav')).toBeNull();
  });
});

// ===========================================================================
// SOK-88 — Renders the crumb trail when crumbs.length > 1
// ===========================================================================

describe('BreadcrumbBar — SOK-88: renders trail with multiple crumbs', () => {
  it('should render all crumb labels when crumbs.length is 2', () => {
    renderBar(TWO_CRUMBS);
    expect(screen.getByText('Tech Watch')).toBeDefined();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should render all crumb labels when crumbs.length is 3', () => {
    renderBar(THREE_CRUMBS);
    expect(screen.getByText('Collections')).toBeDefined();
    expect(screen.getByText('Tech Watch')).toBeDefined();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should render a nav element with aria-label Breadcrumb', () => {
    renderBar(TWO_CRUMBS);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeDefined();
  });
});

// ===========================================================================
// SOK-88 — Each crumb except the last is a clickable button
// ===========================================================================

describe('BreadcrumbBar — SOK-88: intermediate crumbs are clickable buttons', () => {
  it('should render the first crumb as a button when there are 2 crumbs', () => {
    renderBar(TWO_CRUMBS);
    // First crumb 'Tech Watch' is not last → must be a button
    const techWatchBtn = screen.getByRole('button', { name: 'Tech Watch' });
    expect(techWatchBtn).toBeDefined();
  });

  it('should render intermediate crumbs as buttons and the last crumb as a span in a 3-crumb trail', () => {
    renderBar(THREE_CRUMBS);
    expect(screen.getByRole('button', { name: 'Collections' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tech Watch' })).toBeDefined();
    // Last crumb must not be a button
    expect(screen.queryByRole('button', { name: 'Semiconductor Shift' })).toBeNull();
  });
});

// ===========================================================================
// SOK-88 — Clicking a crumb navigates to its path
// ===========================================================================

describe('BreadcrumbBar — SOK-88: clicking a crumb navigates', () => {
  it('should navigate to the first crumb path when it is clicked in a 2-crumb trail', async () => {
    renderBar(TWO_CRUMBS);
    await userEvent.click(screen.getByRole('button', { name: 'Tech Watch' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections/col-1');
  });

  it('should navigate to the correct path when the middle crumb is clicked in a 3-crumb trail', async () => {
    renderBar(THREE_CRUMBS);
    await userEvent.click(screen.getByRole('button', { name: 'Tech Watch' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections/col-1');
  });

  it('should navigate to the root path when the first crumb is clicked in a 3-crumb trail', async () => {
    renderBar(THREE_CRUMBS);
    await userEvent.click(screen.getByRole('button', { name: 'Collections' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
  });
});

// ===========================================================================
// SOK-88 — Last crumb is not interactive
// ===========================================================================

describe('BreadcrumbBar — SOK-88: last crumb is not a button', () => {
  it('should not render the last crumb as a button in a 2-crumb trail', () => {
    renderBar(TWO_CRUMBS);
    expect(screen.queryByRole('button', { name: 'Semiconductor Shift' })).toBeNull();
  });

  it('should not render the last crumb as a button in a 3-crumb trail', () => {
    renderBar(THREE_CRUMBS);
    expect(screen.queryByRole('button', { name: 'Semiconductor Shift' })).toBeNull();
  });

  it('should render the last crumb label as a plain text span', () => {
    renderBar(TWO_CRUMBS);
    // The last crumb text must exist but not be wrapped in a button
    const lastCrumb = screen.getByText('Semiconductor Shift');
    expect(lastCrumb.tagName.toLowerCase()).toBe('span');
  });
});

// ===========================================================================
// SOK-88 — pushCrumb truncates trail when navigating back to an existing path
// ===========================================================================

describe('BreadcrumbBar — SOK-88: pushCrumb behaviour', () => {
  it('should truncate the trail to the crumb clicked when it already exists in the trail', () => {
    // Helper that drives the context directly
    let pushCrumbFn: (c: Crumb) => void;

    function ContextCapture() {
      const { pushCrumb } = useBreadcrumb();
      pushCrumbFn = pushCrumb;
      return null;
    }

    render(
      <BreadcrumbProvider>
        <ContextCapture />
        <CrumbSetter crumbs={THREE_CRUMBS} />
        <BreadcrumbBar />
      </BreadcrumbProvider>,
    );

    // Verify 3-crumb trail is rendered
    expect(screen.getByRole('button', { name: 'Collections' })).toBeDefined();

    // pushCrumb to an existing path (Tech Watch) should truncate to 2 crumbs
    React.act(() => {
      pushCrumbFn({ label: 'Tech Watch', path: '/collections/col-1' });
    });

    // After truncation 'Semiconductor Shift' should no longer appear
    expect(screen.queryByText('Semiconductor Shift')).toBeNull();
  });
});
