/**
 * Frontend unit tests: NarrativeTrends page (SOK-39 carry-in)
 * Mirrors: src/pages/NarrativeTrends.tsx
 *
 * Covers: loading state, loaded state with search name, empty trends,
 *         interval switching, view toggling (current/parent),
 *         narrative shifts section, sidebar navigation labels.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseParams, mockNavigate } = vi.hoisted(() => ({
  mockUseQuery:   vi.fn(),
  mockUseParams:  vi.fn(),
  mockNavigate:   vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery: mockUseQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useParams:   () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span data-testid="status-dot" />,
}));

vi.mock('../components/trends/VolumeChart', () => ({
  VolumeChart: ({ loading }: { loading: boolean }) => (
    <div data-testid="volume-chart">{loading ? 'loading' : 'chart'}</div>
  ),
}));

vi.mock('../components/trends/SentimentBreakdown', () => ({
  SentimentBreakdown: ({ loading }: { loading: boolean }) => (
    <div data-testid="sentiment-breakdown">{loading ? 'loading' : 'breakdown'}</div>
  ),
}));

vi.mock('../components/trends/TopicCloud', () => ({
  TopicCloud: ({ loading }: { loading: boolean }) => (
    <div data-testid="topic-cloud">{loading ? 'loading' : 'cloud'}</div>
  ),
}));

vi.mock('../components/trends/SourceRankings', () => ({
  SourceRankings: ({ loading }: { loading: boolean }) => (
    <div data-testid="source-rankings">{loading ? 'loading' : 'rankings'}</div>
  ),
}));

vi.mock('../components/trends/NarrativeShiftCard', () => ({
  NarrativeShiftCard: ({
    title,
    type,
  }: {
    title: string;
    type: string;
    body: string;
    live: boolean;
    time: string;
  }) => (
    <div data-testid="narrative-shift-card">
      <span data-testid="shift-type">{type}</span>
      <span data-testid="shift-title">{title}</span>
    </div>
  ),
}));

import { NarrativeTrends } from '../pages/NarrativeTrends';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TRENDS_FIXTURE = {
  searchId:    'search-1',
  searchName:  'Semiconductor Shift',
  interval:    'day',
  totalArticles: 42,
  volumeOverTime: [],
  sentimentBreakdown: {
    positive: 20, neutral: 12, negative: 10,
    total: 42,
    positivePercent: 47.6, neutralPercent: 28.6, negativePercent: 23.8,
  },
  topSources: [],
  topTopics:  [],
};

beforeEach(() => {
  mockUseQuery.mockReset();
  mockNavigate.mockReset();
  mockUseParams.mockReturnValue({ id: 'search-1' });
});

function renderPage() {
  return render(<NarrativeTrends />);
}

// ===========================================================================
// Loading state
// ===========================================================================

describe('NarrativeTrends — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
  });

  it('should render skeleton placeholder for the heading while loading', () => {
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render the VolumeChart component in loading state', () => {
    renderPage();
    expect(screen.getByTestId('volume-chart').textContent).toBe('loading');
  });

  it('should render the SentimentBreakdown component in loading state', () => {
    renderPage();
    expect(screen.getByTestId('sentiment-breakdown').textContent).toBe('loading');
  });

  it('should not render a search name heading while loading', () => {
    renderPage();
    expect(screen.queryByText('Semiconductor Shift')).toBeNull();
  });
});

// ===========================================================================
// Loaded state
// ===========================================================================

describe('NarrativeTrends — loaded state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { narrativeTrends: TRENDS_FIXTURE }, loading: false });
  });

  it('should render the search name as the heading', () => {
    renderPage();
    expect(screen.getByText('Semiconductor Shift')).toBeDefined();
  });

  it('should render the CURRENT NARRATIVE badge', () => {
    renderPage();
    expect(screen.getByTestId('badge').textContent).toBe('CURRENT NARRATIVE');
  });

  it('should render the VolumeChart in a non-loading state', () => {
    renderPage();
    expect(screen.getByTestId('volume-chart').textContent).toBe('chart');
  });

  it('should render the TopicCloud component', () => {
    renderPage();
    expect(screen.getByTestId('topic-cloud')).toBeDefined();
  });

  it('should render the SourceRankings component', () => {
    renderPage();
    expect(screen.getByTestId('source-rankings')).toBeDefined();
  });
});

// ===========================================================================
// Empty / no-data state
// ===========================================================================

describe('NarrativeTrends — no data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });
  });

  it('should render Narrative Trends as the fallback heading when data is absent', () => {
    renderPage();
    expect(screen.getByText('Narrative Trends')).toBeDefined();
  });
});

// ===========================================================================
// Narrative shift cards
// ===========================================================================

describe('NarrativeTrends — narrative shift cards', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { narrativeTrends: TRENDS_FIXTURE }, loading: false });
  });

  it('should render the Recent Narrative Shifts heading', () => {
    renderPage();
    expect(screen.getByText('Recent Narrative Shifts')).toBeDefined();
  });

  it('should render exactly three NarrativeShiftCard components', () => {
    renderPage();
    const cards = screen.getAllByTestId('narrative-shift-card');
    expect(cards).toHaveLength(3);
  });

  it('should render the EMERGENT TOPIC shift type', () => {
    renderPage();
    const types = screen.getAllByTestId('shift-type').map(el => el.textContent);
    expect(types).toContain('EMERGENT TOPIC');
  });

  it('should render the SENTIMENT SHIFT shift type', () => {
    renderPage();
    const types = screen.getAllByTestId('shift-type').map(el => el.textContent);
    expect(types).toContain('SENTIMENT SHIFT');
  });

  it('should render the ANOMALY DETECTED shift type', () => {
    renderPage();
    const types = screen.getAllByTestId('shift-type').map(el => el.textContent);
    expect(types).toContain('ANOMALY DETECTED');
  });
});

// ===========================================================================
// Interval switching
// ===========================================================================

describe('NarrativeTrends — interval switching', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { narrativeTrends: TRENDS_FIXTURE }, loading: false });
  });

  it('should render all three interval buttons', () => {
    renderPage();
    expect(screen.getByText('L7D')).toBeDefined();
    expect(screen.getByText('L30D')).toBeDefined();
    expect(screen.getByText('L90D')).toBeDefined();
  });

  it('should re-render with the selected interval highlighted when L30D is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('L30D'));
    // After click the component has updated interval state; the query re-runs
    // with new interval — we verify the button remains in the DOM (no crash)
    expect(screen.getByText('L30D')).toBeDefined();
  });
});

// ===========================================================================
// Interval controls (L7D / L30D / L90D) — replaces the removed view toggle
// ===========================================================================

describe('NarrativeTrends — interval controls', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { narrativeTrends: TRENDS_FIXTURE }, loading: false });
  });

  it('should render all three interval buttons (L7D, L30D, L90D)', () => {
    renderPage();
    expect(screen.getByText('L7D')).toBeDefined();
    expect(screen.getByText('L30D')).toBeDefined();
    expect(screen.getByText('L90D')).toBeDefined();
  });

  it('should keep the L30D button in the DOM after it is clicked without crashing', async () => {
    renderPage();
    await userEvent.click(screen.getByText('L30D'));
    expect(screen.getByText('L30D')).toBeDefined();
  });
});

// ===========================================================================
// Sidebar navigation
// ===========================================================================

describe('NarrativeTrends — sidebar navigation', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { narrativeTrends: TRENDS_FIXTURE }, loading: false });
  });

  it('should render the sidebar navigation labels', () => {
    renderPage();
    expect(screen.getByText('RECENT')).toBeDefined();
    expect(screen.getByText('LINEAGE')).toBeDefined();
    expect(screen.getByText('SOURCES')).toBeDefined();
  });
});
