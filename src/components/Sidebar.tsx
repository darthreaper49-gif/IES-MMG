import {
  ArrowUpRight,
  BellRing,
  BookOpen,
  Camera,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  LayoutDashboard,
  Radio,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { Page } from '../types'
import { Logo } from './ui'

export const pageNames: Record<Page, string> = {
  overview: 'Overview',
  live: 'Live view',
  events: 'Events & alerts',
  recordings: 'Recordings',
  analytics: 'Analytics',
  cameras: 'Cameras',
  rules: 'Detection rules',
  settings: 'Settings',
}
export function Sidebar({
  page,
  navigate,
  alertCount,
  open,
  onClose,
  name,
  workspace,
  onHelp,
}: {
  page: Page
  navigate: (page: Page) => void
  alertCount: number
  open: boolean
  onClose: () => void
  name: string
  workspace: string
  onHelp: () => void
}) {
  const go = (p: Page) => {
    navigate(p)
    onClose()
  }
  const navItem = (p: Page, Icon: typeof LayoutDashboard, badge?: number) => (
    <button
      key={p}
      className={`nav-item ${page === p ? 'nav-active' : ''}`}
      onClick={() => go(p)}
      aria-current={page === p ? 'page' : undefined}
    >
      <Icon size={18} strokeWidth={1.7} />
      <span>{pageNames[p]}</span>
      {badge !== undefined && badge > 0 && <span className="nav-badge">{badge}</span>}
      {page === p && <span className="nav-active-dot" />}
    </button>
  )
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <button onClick={() => go('overview')} aria-label="Vigil home">
            <Logo />
          </button>
          <button className="mobile-sidebar-close" onClick={onClose} aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>
        <button className="workspace-switch" onClick={() => go('settings')}>
          <span className="workspace-icon">{workspace.trim()[0]?.toUpperCase() ?? 'M'}</span>
          <span>
            <strong>{workspace.replace(' workspace', '')}</strong>
            <small>Security workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="sidebar-nav">
          <div className="nav-label">WORKSPACE</div>
          {navItem('overview', LayoutDashboard)}
          {navItem('live', Radio)}
          {navItem('events', BellRing, alertCount)}
          {navItem('recordings', Clapperboard)}
          <div className="nav-label nav-label-second">INTELLIGENCE</div>
          {navItem('analytics', ChartNoAxesCombined)}
          {navItem('rules', ShieldCheck)}
          <div className="nav-label nav-label-second">MANAGE</div>
          {navItem('cameras', Camera)}
          {navItem('settings', Settings2)}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="sidebar-status-icon">
              <ShieldCheck size={20} />
            </span>
            <strong>Everything looks good</strong>
            <p>All systems operational</p>
            <div>
              <span className="status-dot" /> Demo environment <CircleHelp size={12} />
            </div>
          </div>
          <button className="sidebar-help" onClick={onHelp}>
            <BookOpen size={16} />
            <span>Help & getting started</span>
            <ArrowUpRight size={14} />
          </button>
          <button className="sidebar-profile" onClick={() => go('settings')}>
            <span className="avatar">
              {name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              <strong>{name}</strong>
              <small>Workspace admin</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
    </>
  )
}
