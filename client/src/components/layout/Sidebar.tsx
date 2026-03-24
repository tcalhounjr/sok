import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, Sliders,
  Archive, HelpCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/search/new', icon: Search,           label: 'Search Builder' },
  { to: '/presets',     icon: Sliders,  label: 'Preset Library' },
  { to: '/collections', icon: Archive, label: 'Collections'    },
];

const bottomItems = [
  { to: '/archive', icon: Archive,   label: 'Archive' },
  { to: '/help',    icon: HelpCircle,label: 'Help'    },
];

export function Sidebar() {
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-surface_container_low border-r border-surface_bright/10 flex-shrink-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-gradient-primary flex items-center justify-center">
            <span className="font-display font-bold text-on_primary text-xs">S</span>
          </div>
          <div>
            <p className="font-display font-bold text-on_surface text-sm leading-tight">Media Intelligence</p>
            <p className="overline text-on_surface_variant" style={{ fontSize: '0.5625rem' }}>ANALYTICAL LENS V1.0</p>
          </div>
        </div>
      </div>

      {/* New Search CTA */}
      <div className="px-4 mb-5">
        <NavLink
          to="/search/new"
          className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2"
        >
          <span className="text-base leading-none">+</span> New Search
        </NavLink>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-sm text-body-md transition-colors',
              isActive
                ? 'bg-surface_container_high text-on_surface border-l-2 border-primary'
                : 'text-on_surface_variant hover:text-on_surface hover:bg-surface_container'
            )}
          >
            <Icon size={15} className="flex-shrink-0" />
            <span className="font-body">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 space-y-0.5">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-sm text-body-md transition-colors',
              isActive
                ? 'text-on_surface'
                : 'text-on_surface_variant hover:text-on_surface hover:bg-surface_container'
            )}
          >
            <Icon size={15} className="flex-shrink-0" />
            <span className="font-body">{label}</span>
          </NavLink>
        ))}
        <div className="px-3 py-2 mt-1">
          <p className="overline text-on_surface_variant" style={{ fontSize: '0.5rem' }}>API Docs</p>
        </div>
      </div>
    </aside>
  );
}
