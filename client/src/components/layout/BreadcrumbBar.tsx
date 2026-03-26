import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

export function BreadcrumbBar() {
  const { crumbs } = useBreadcrumb();
  const navigate = useNavigate();

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-surface_container border-b border-surface_bright/10 px-8 py-2 flex items-center gap-1.5 flex-shrink-0"
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1.5">
            {idx > 0 && (
              <span className="text-on_surface_variant text-xs select-none" aria-hidden="true">
                &rsaquo;
              </span>
            )}
            {isLast ? (
              <span className="text-label-sm font-body text-on_surface">
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="text-label-sm font-body text-on_surface_variant hover:text-on_surface transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
