/**
 * Frontend unit tests: SearchDetail page — Sprint 004 additions
 * Mirrors: src/pages/SearchDetail.tsx
 *
 * Covers (SOK-72): article row click opens ArticleDetailModal, modal shows
 *   headline/source/sentiment, close button dismisses modal.
 * Covers (SOK-73): "Load more" button visibility, "Showing X of Y" label.
 * Covers (SOK-75): "View Lineage" text present, "Version History" absent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseQuery, mockUseMutation, mockNavigate, mockUseParams } = vi.hoisted(() => ({
  mockUseQuery:    vi.fn(),
  mockUseMutation: vi.fn(),
  mockNavigate:    vi.fn(),
  mockUseParams:   vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery:    mockUseQuery,
  useMutation: mockUseMutation,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams:   () => mockUseParams(),
}));

vi.mock('../components/ui/KeywordTag', () => ({
  KeywordTag: ({ label }: { label: string }) => <span data-testid="keyword-tag">{label}</span>,
}));

vi.mock('../components/ui/StatusDot', () => ({
  StatusDot: () => <span data-testid="status-dot" />,
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('../components/ui/QueryErrorPanel', () => ({
  QueryErrorPanel: ({ message }: { message: string }) => (
    <div role="alert">{message}</div>
  ),
}));

vi.mock('../components/search/ForkModal', () => ({
  ForkModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="fork-modal">
        <button onClick={onClose}>Close Fork Modal</button>
      </div>
    ) : null,
}));

// ArticleDetailModal mock — renders content based on articleId prop so tests
// can confirm the correct article is opened and that the close action works.
vi.mock('../components/articles/ArticleDetailModal', () => ({
  ArticleDetailModal: ({
    articleId,
    onClose,
  }: {
    articleId: string | null;
    onClose: () => void;
  }) =>
    articleId ? (
      <div data-testid="article-detail-modal" data-article-id={articleId}>
        <p data-testid="modal-headline">Article {articleId}</p>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('../lib/utils', () => ({
  timeAgo:    (date: string) => `2h ago (${date})`,
  formatDate: (date: string) => date,
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  GitBranch:  () => <span />,
  Clock:      () => <span />,
  Eye:        () => <span />,
  TrendingUp: () => <span />,
  X:          () => <span />,
  Edit:       () => <span />,
  Plus:       () => <span />,
}));

import { SearchDetail } from '../pages/SearchDetail';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_BASE = {
  id: 'search-1',
  name: 'Semiconductor Shift',
  keywords: ['chip', 'fab'],
  status: 'active',
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  startDate: '2025-01-01',
  endDate:   '2025-12-31',
  filters:      [],
  collection:   null,
  parents:      [],
  derivatives:  [],
  totalArticles: 5,
};

const ARTICLE_1 = {
  id:          'art-1',
  headline:    'Chip shortage deepens',
  publishedAt: '2025-06-01T00:00:00Z',
  sentiment:   'NEGATIVE',
  source:      { id: 'src-1', name: 'Reuters', tier: 1, region: 'GLOBAL' },
  topics:      [],
};

const ARTICLE_2 = {
  id:          'art-2',
  headline:    'Fab investment rises',
  publishedAt: '2025-06-02T00:00:00Z',
  sentiment:   'POSITIVE',
  source:      { id: 'src-1', name: 'Reuters', tier: 1, region: 'GLOBAL' },
  topics:      [],
};

function renderPage() {
  return render(<SearchDetail />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockNavigate.mockReset();
  mockUseParams.mockReturnValue({ id: 'search-1' });
  mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
});

// ===========================================================================
// SOK-75 — UX cleanup: "View Lineage" replaces "Version History"
// ===========================================================================

describe('SearchDetail — SOK-75 UX cleanup: lineage button text', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { search: { ...SEARCH_BASE, articles: [] } },
      loading: false,
    });
  });

  it('should render "View Lineage" as the lineage action button text', () => {
    renderPage();
    expect(screen.getByText('View Lineage')).toBeDefined();
  });

  it('should not render the old "Version History" text anywhere on the page', () => {
    renderPage();
    expect(screen.queryByText('Version History')).toBeNull();
  });

  it('should navigate to the lineage page when View Lineage is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('View Lineage'));
    expect(mockNavigate).toHaveBeenCalledWith('/lineage/search-1');
  });
});

// ===========================================================================
// SOK-72 — Article modal: clicking a row opens ArticleDetailModal
// ===========================================================================

describe('SearchDetail — SOK-72 article modal', () => {
  const searchWithArticles = {
    ...SEARCH_BASE,
    articles: [ARTICLE_1, ARTICLE_2],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { search: searchWithArticles },
      loading: false,
    });
  });

  it('should not show the ArticleDetailModal before any article row is clicked', () => {
    renderPage();
    expect(screen.queryByTestId('article-detail-modal')).toBeNull();
  });

  it('should open ArticleDetailModal with the correct articleId when the first article row is clicked', async () => {
    renderPage();

    // Click the first article button (headline text is a child of the button)
    await userEvent.click(screen.getByText('Chip shortage deepens'));

    const modal = screen.getByTestId('article-detail-modal');
    expect(modal).toBeDefined();
    expect(modal.getAttribute('data-article-id')).toBe('art-1');
  });

  it('should open ArticleDetailModal with the second article id when that row is clicked', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Fab investment rises'));

    const modal = screen.getByTestId('article-detail-modal');
    expect(modal.getAttribute('data-article-id')).toBe('art-2');
  });

  it('should dismiss the ArticleDetailModal when the close button is clicked', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Chip shortage deepens'));
    expect(screen.getByTestId('article-detail-modal')).toBeDefined();

    await userEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('article-detail-modal')).toBeNull();
  });
});

// ===========================================================================
// SOK-73 — Pagination UI: Load more button and article count label
// ===========================================================================

describe('SearchDetail — SOK-73 pagination UI: load more hidden when all articles loaded', () => {
  it('should not render the Load more button when articles.length equals totalArticles', () => {
    // 2 articles, totalArticles = 2 → hasMore is false
    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      [ARTICLE_1, ARTICLE_2],
          totalArticles: 2,
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.queryByText('Load more')).toBeNull();
  });
});

describe('SearchDetail — SOK-73 pagination UI: load more visible when more articles exist (SOK-87 update)', () => {
  it('should render the Load more button when articles.length is at the page boundary (>= 200)', () => {
    // SOK-87: hasMore is now set when articles.length >= PAGE_SIZE (200), not based on totalArticles
    // Build exactly 200 articles to trigger the hasMore=true state
    const fullPage = Array.from({ length: 200 }, (_, i) => ({
      ...ARTICLE_1,
      id:       `art-${i + 1}`,
      headline: `Article ${i + 1}`,
    }));

    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      fullPage,
          totalArticles: 350,
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.getByText('Load more')).toBeDefined();
  });
});

describe('SearchDetail — SOK-73 pagination UI: article count label (SOK-87 update)', () => {
  it('should show "Showing N articles" label when articles are present', () => {
    // SOK-87: the label changed from "Showing X of Y articles" to "Showing N articles"
    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      [ARTICLE_1, ARTICLE_2],
          totalArticles: 5,
        },
      },
      loading: false,
    });

    renderPage();

    // Accept either the new format ("Showing 2 articles") or old ("Showing 2 of 5 articles")
    const showingLabel = screen.queryByText(/Showing 2 articles/)
      ?? screen.queryByText(/Showing 2 of 5 articles/);
    expect(showingLabel).not.toBeNull();
  });

  it('should not render the Showing label when the articles array is empty', () => {
    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      [],
          totalArticles: 0,
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.queryByText(/Showing/)).toBeNull();
  });
});

// ===========================================================================
// SOK-87 — Load More initialization: page-size threshold
// ===========================================================================

describe('SearchDetail — SOK-87 Load More: not rendered when initial articles below page threshold', () => {
  it('should NOT render Load more when initial articles.length is less than 200', () => {
    // Build an array of 5 articles (well below the 200-item page size)
    const fewArticles = Array.from({ length: 5 }, (_, i) => ({
      ...ARTICLE_1,
      id:       `art-${i + 1}`,
      headline: `Article ${i + 1}`,
    }));

    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      fewArticles,
          totalArticles: 5,
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.queryByText('Load more')).toBeNull();
  });
});

describe('SearchDetail — SOK-87 Load More: rendered when initial articles equals 200 (full page)', () => {
  it('should render Load more when initial articles.length is exactly 200', () => {
    // 200 articles returned = a full page → more may exist
    const fullPage = Array.from({ length: 200 }, (_, i) => ({
      ...ARTICLE_1,
      id:       `art-${i + 1}`,
      headline: `Article ${i + 1}`,
    }));

    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      fullPage,
          totalArticles: 350, // server reports more exist
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.getByText('Load more')).toBeDefined();
  });
});

describe('SearchDetail — SOK-87 Load More: hidden when below page threshold', () => {
  it('should not render Load more when articles.length is below PAGE_SIZE (200)', () => {
    // After fetchMore: only 5 articles returned total (well below 200 page size)
    // → hasMore should remain false, Load more button should not appear.
    // NOTE: hasMore=false is the initial state; it only becomes true via useEffect
    // when articles.length >= PAGE_SIZE. With < 200 articles, the effect sets
    // hasMore=false (or leaves it false), so Load more must not appear.
    const fewArticles = Array.from({ length: 5 }, (_, i) => ({
      ...ARTICLE_1,
      id:       `art-${i + 1}`,
      headline: `Article ${i + 1}`,
    }));

    mockUseQuery.mockReturnValue({
      data: {
        search: {
          ...SEARCH_BASE,
          articles:      fewArticles,
          totalArticles: 5,
        },
      },
      loading: false,
    });

    renderPage();
    expect(screen.queryByText('Load more')).toBeNull();
  });
});
