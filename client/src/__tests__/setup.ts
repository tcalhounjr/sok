/**
 * Global test setup — runs before every test file.
 * Polyfills jsdom environment gaps needed by Apollo Client and React Router.
 */
import '@testing-library/react';

// Silence React 19 act() warnings in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
