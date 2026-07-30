import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/Avatar';
import { PlanBadge } from '@/components/StatusBadge';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/notes', label: 'Notes', icon: FileText },
  { to: '/app/payments', label: 'Payments', icon: CreditCard },
  { to: '/app/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/app/chat', label: 'Messages', icon: MessageSquare },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { therapist, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!therapist) return null;

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-sage-50">
      
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sage-200/70 bg-white lg:flex">
        <SidebarContent therapist={therapist} onSignOut={handleSignOut} />
      </aside>

  
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 text-ink-400 hover:text-ink-600"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              therapist={therapist}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

    
      <div className="lg:pl-64">
    
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sage-200/70 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sage-700" />
            <span className="font-serif text-lg font-semibold text-sage-900">Unfazed</span>
          </Link>
          <Avatar name={therapist.full_name} size="sm" />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  therapist,
  onSignOut,
  onNavigate,
}: {
  therapist: NonNullable<ReturnType<typeof useAuth>['therapist']>;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-700">
            <Sparkles className="h-4.5 w-4.5 text-sage-100" />
          </div>
          <span className="font-serif text-lg font-semibold text-sage-900">Unfazed</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2 scrollbar-thin overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sage-100 text-sage-800'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <Link
          to={`/t/${therapist.slug}`}
          onClick={onNavigate}
          className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-50"
        >
          <ExternalLink className="h-4 w-4" />
          Preview your public page
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar name={therapist.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{therapist.full_name}</p>
            <div className="mt-0.5">
              <PlanBadge tier={therapist.tier_key} />
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </>
  );
}
