/**
 * Frontend unit tests: ArticleDetailModal component (SOK-72)
 * Mirrors: src/components/articles/ArticleDetailModal.tsx
 *
 * Covers: renders when articleId is provided, displays headline/source/sentiment,
 *         loading skeleton, not-found state, close button dismisses the modal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useQuery: mockUseQuery,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('../components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

vi.mock('../components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock Modal to simplify testing — renders children when open, nothing when closed.
// Exposes an X close button with aria-label so tests can click it.
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
    overline?: string;
    children: React.ReactNode;
    className?: string;
  }) =>
    open ? (
      <div data-testid="modal">
        <h2 data-testid="modal-title">{title}</h2>
        <button aria-label="Close modal" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock('../lib/utils', () => ({
  formatDate: (d: string) => d,
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  ExternalLink: () => <span data-icon="external-link" />,
}));

import { ArticleDetailModal } from '../components/articles/ArticleDetailModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ARTICLE_FIXTURE = {
  id:          'art-1',
  headline:    'Chip shortage deepens in Q3',
  body:        'Full article body text here.',
  url:         'https://reuters.com/article/chips',
  publishedAt: '2025-06-01',
  sentiment:   'NEGATIVE',
  source: {
    id:   'src-1',
    name: 'Reuters',
    tier: 1,
  },
  author: null,
};

function renderModal(articleId: string | null, onClose = vi.fn()) {
  return render(<ArticleDetailModal articleId={articleId} onClose={onClose} />);
}

beforeEach(() => {
  mockUseQuery.mockReset();
});

// ===========================================================================
// Closed / no articleId
// ===========================================================================

describe('ArticleDetailModal — closed state', () => {
  it('should render nothing when articleId is null', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });
    renderModal(null);
    expect(screen.queryByTestId('modal')).toBeNull();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('ArticleDetailModal — loading state', () => {
  it('should render skeleton placeholders while the article is loading', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
    renderModal('art-1');
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show Loading title text while fetching', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
    renderModal('art-1');
    expect(screen.getByTestId('modal-title').textContent).toContain('Loading');
  });
});

// ===========================================================================
// Loaded state — full article
// ===========================================================================

describe('ArticleDetailModal — loaded with article data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data:    { article: ARTICLE_FIXTURE },
      loading: false,
    });
  });

  it('should display the article headline as the modal title', () => {
    renderModal('art-1');
    expect(screen.getByTestId('modal-title').textContent).toBe('Chip shortage deepens in Q3');
  });

  it('should display the source name', () => {
    renderModal('art-1');
    expect(screen.getByText('Reuters')).toBeDefined();
  });

  it('should display a sentiment badge', () => {
    renderModal('art-1');
    // Badge renders the sentimentLabel string
    expect(screen.getByText('Negative')).toBeDefined();
  });

  it('should display the article body text', () => {
    renderModal('art-1');
    expect(screen.getByText('Full article body text here.')).toBeDefined();
  });

  it('should render an external link to the article URL', () => {
    renderModal('art-1');
    const link = screen.getByRole('link', { name: /view original/i });
    expect(link.getAttribute('href')).toBe('https://reuters.com/article/chips');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should dismiss the modal when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal('art-1', onClose);
    await userEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// Not-found state
// ===========================================================================

describe('ArticleDetailModal — not-found state', () => {
  it('should render an alert when the article query returns null', () => {
    mockUseQuery.mockReturnValue({ data: { article: null }, loading: false });
    renderModal('missing-art');
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toContain('not found');
  });
});

// ===========================================================================
// Body absent
// ===========================================================================

describe('ArticleDetailModal — article body absent', () => {
  it('should render a fallback message when article body is empty', () => {
    mockUseQuery.mockReturnValue({
      data:    { article: { ...ARTICLE_FIXTURE, body: '' } },
      loading: false,
    });
    renderModal('art-1');
    expect(screen.getByText('Article body not available.')).toBeDefined();
  });
});

// ===========================================================================
// Unsafe URL — external link suppressed
// ===========================================================================

describe('ArticleDetailModal — unsafe URL suppression', () => {
  it('should not render the external link when URL is not http/https', () => {
    mockUseQuery.mockReturnValue({
      data:    { article: { ...ARTICLE_FIXTURE, url: 'javascript:void(0)' } },
      loading: false,
    });
    renderModal('art-1');
    expect(screen.queryByRole('link', { name: /view original/i })).toBeNull();
  });
});

// ===========================================================================
// SENTIMENT variants
// ===========================================================================

describe('ArticleDetailModal — sentiment labels', () => {
  it('should show Positive label for POSITIVE sentiment', () => {
    mockUseQuery.mockReturnValue({
      data:    { article: { ...ARTICLE_FIXTURE, sentiment: 'POSITIVE' } },
      loading: false,
    });
    renderModal('art-1');
    expect(screen.getByText('Positive')).toBeDefined();
  });

  it('should show Neutral label for NEUTRAL sentiment', () => {
    mockUseQuery.mockReturnValue({
      data:    { article: { ...ARTICLE_FIXTURE, sentiment: 'NEUTRAL' } },
      loading: false,
    });
    renderModal('art-1');
    expect(screen.getByText('Neutral')).toBeDefined();
  });
});
