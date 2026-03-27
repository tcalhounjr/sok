import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface Crumb { label: string; path: string; }

interface BreadcrumbContextValue {
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
  pushCrumb: (crumb: Crumb) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbsState] = useState<Crumb[]>([]);

  const setCrumbs = useCallback((c: Crumb[]) => setCrumbsState(c), []);

  const pushCrumb = useCallback((crumb: Crumb) => {
    setCrumbsState(prev => {
      // If this path is already in the trail, truncate to it (going back)
      const existingIdx = prev.findIndex(c => c.path === crumb.path);
      if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
      return [...prev, crumb];
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs, pushCrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  return ctx;
}
