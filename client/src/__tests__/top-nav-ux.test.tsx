/**
 * Frontend unit tests: TopNav — SOK-75 UX cleanup
 * Mirrors: src/components/layout/TopNav.tsx
 *
 * Covers:
 * - Dead top nav tabs (Analytics, Narratives) do not render on the home route
 * - Dead top nav tabs (Search, Collections, Filters) do not render on /trends
 * - Only the correct tab set renders for each route
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const { mockUseLocation } = vi.hoisted(() => ({
  mockUseLocation: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock('lucide-react', () => ({
  Search:   () => <span data-icon="search" />,
  Bell:     () => <span data-icon="bell" />,
  Settings: () => <span data-icon="settings" />,
}));

import { TopNav } from '../components/layout/TopNav';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAt(pathname: string) {
  mockUseLocation.mockReturnValue({ pathname });
  return render(<TopNav />);
}

// ===========================================================================
// SOK-75 — Home route: dead tabs must not appear
// ===========================================================================

describe('TopNav — home route (/) tab hygiene', () => {
  it('should not render an Analytics tab on the home route', () => {
    renderAt('/');
    expect(screen.queryByRole('button', { name: /analytics/i })).toBeNull();
    expect(screen.queryByText(/analytics/i)).toBeNull();
  });

  it('should not render a Narratives tab on the home route', () => {
    renderAt('/');
    expect(screen.queryByRole('button', { name: /narratives/i })).toBeNull();
    expect(screen.queryByText(/narratives/i)).toBeNull();
  });

  it('should render the Sources tab on the home route', () => {
    renderAt('/');
    expect(screen.getByText('Sources')).toBeDefined();
  });
});

// ===========================================================================
// SOK-75 — /trends route: dead tabs must not appear
// ===========================================================================

describe('TopNav — /trends route tab hygiene', () => {
  it('should not render a Search tab on the /trends route', () => {
    renderAt('/trends');
    expect(screen.queryByRole('button', { name: /^search$/i })).toBeNull();
    // "Search" may appear in the input placeholder — check button specifically
    const buttons = screen.queryAllByRole('button');
    const searchTab = buttons.find(b => b.textContent?.trim() === 'Search');
    expect(searchTab).toBeUndefined();
  });

  it('should not render a Collections tab on the /trends route', () => {
    renderAt('/trends');
    expect(screen.queryByText('Collections')).toBeNull();
  });

  it('should not render a Filters tab on the /trends route', () => {
    renderAt('/trends');
    expect(screen.queryByText('Filters')).toBeNull();
  });

  it('should render the Trends tab on the /trends route', () => {
    renderAt('/trends');
    expect(screen.getByText('Trends')).toBeDefined();
  });
});

// ===========================================================================
// SOK-75 — /presets route renders only its own tab
// ===========================================================================

describe('TopNav — /presets route tab hygiene', () => {
  it('should not render Analytics, Narratives, Search, Collections or Filters tabs', () => {
    renderAt('/presets');
    const deadTabs = ['Analytics', 'Narratives', 'Search', 'Collections', 'Filters'];
    for (const tab of deadTabs) {
      expect(screen.queryByRole('button', { name: tab })).toBeNull();
    }
  });

  it('should render the Curation Tools tab on the /presets route', () => {
    renderAt('/presets');
    expect(screen.getByText('Curation Tools')).toBeDefined();
  });
});

// ===========================================================================
// General — app name always renders
// ===========================================================================

describe('TopNav — always present elements', () => {
  it('should always render the NarrativeTracker app name', () => {
    renderAt('/');
    expect(screen.getByText('NarrativeTracker')).toBeDefined();
  });

  it('should always render the search input on every route', () => {
    renderAt('/trends');
    expect(screen.getByPlaceholderText('Search library...')).toBeDefined();
  });
});
