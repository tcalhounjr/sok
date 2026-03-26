/**
 * Global test setup — runs before every test file.
 * Polyfills jsdom environment gaps needed by Apollo Client and React Router.
 */
import '@testing-library/react';
import { vi } from 'vitest';

// Silence React 19 act() warnings in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// jsdom does not implement scrollIntoView — polyfill it so that any component
// calling element.scrollIntoView() (e.g. NarrativeTrends onViewAll handler)
// does not throw an unhandled TypeError during tests.
// ---------------------------------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

// ---------------------------------------------------------------------------
// SOK-88 — BreadcrumbContext global mock
//
// The BreadcrumbProvider was introduced in Sprint 5 (SOK-88) and is now
// rendered by every page (SearchDetail, CollectionManagement, etc.).
// useBreadcrumb() throws if its context is absent, which breaks all existing
// page tests that render pages without a BreadcrumbProvider wrapper.
//
// We stub the entire context module globally here so all test files see a
// no-op BreadcrumbProvider and a safe useBreadcrumb hook without needing
// to individually mock it in each test file.
// ---------------------------------------------------------------------------
vi.mock('../context/BreadcrumbContext', () => {
  const React = require('react');
  function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  }
  function useBreadcrumb() {
    return {
      crumbs:     [],
      setCrumbs:  () => {},
      pushCrumb:  () => {},
    };
  }
  return { BreadcrumbProvider, useBreadcrumb };
});
