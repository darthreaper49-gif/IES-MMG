import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Film,
  LayoutGrid,
  Menu,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  Camera,
  DetectionEvent,
  DetectionRule,
  Dialog,
  EventType,
  Page,
  Preferences,
} from './types'
import {
  initialCameras,
  initialEvents,
  initialPreferences,
  initialRecordings,
  initialRules,
  formatDuration,
} from './data'
import {
  Badge,
  downloadSnapshot,
  HealthCard,
  PageHeading,
  usePersistentState,
} from './components/ui'
import { Sidebar, pageNames } from './components/Sidebar'
import { CameraWall } from './components/CameraWall'
import { ActivityPanel } from './components/ActivityPanel'
import { Stats } from './components/Stats'
import { Dialogs } from './components/Dialogs'
import { EventsPage } from './pages/EventsPage'
import { CamerasPage } from './pages/CamerasPage'
import { RulesPage } from './pages/RulesPage'
import { SettingsPage } from './pages/SettingsPage'
import { RecordingsPage } from './pages/RecordingsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

const validPages = Object.keys(pageNames)
function currentPage(): Page {
  const hash = window.location.hash.replace('#', '')
  return validPages.includes(hash) ? (hash as Page) : 'overview'
}
export default function App() {
  const [page, setPage] = useState<Page>(currentPage)
  const [cameras, setCameras] = usePersistentState<Camera[]>('cameras-v1', initialCameras)
  const [events, setEvents] = usePersistentState<DetectionEvent[]>('events-v1', initialEvents)
  const [rules, setRules] = usePersistentState<DetectionRule[]>('rules-v1', initialRules)
  const [preferences, setPreferences] = usePersistentState<Preferences>(
    'preferences-v1',
    initialPreferences,
  )
  const [dialog, setDialog] = useState<Dialog>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [location, setLocation] = useState('all')
  const [selectedRecording, setSelectedRecording] = useState(initialRecordings[0].id)
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)
  const [site, setSite] = useState('All locations')
  const notificationRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const alertCount = events.filter((e) => e.alert && !e.reviewed).length
  const notify = useCallback((message: string) => setToast({ message, id: Date.now() }), [])
  const navigate = useCallback((next: Page) => {
    setPage(next)
    window.location.hash = next
    setSidebarOpen(false)
    setNotificationsOpen(false)
    setWorkspaceOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  useEffect(() => {
    const handler = () => {
      setPage(currentPage())
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  useEffect(() => {
    document.title = `${pageNames[page]} · Vigil`
  }, [page])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setDialog((d) => (d?.type === 'search' ? null : { type: 'search' }))
      }
      if (e.key === 'Escape') {
        setNotificationsOpen(false)
        setWorkspaceOpen(false)
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!notificationRef.current?.contains(e.target as Node)) setNotificationsOpen(false)
      if (!workspaceRef.current?.contains(e.target as Node)) setWorkspaceOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const onSnapshot = async (camera: Camera, overlays: boolean) => {
    try {
      await downloadSnapshot(camera, overlays)
      notify(`Snapshot saved · ${camera.name}`)
    } catch {
      notify('Could not save the snapshot. Please try again.')
    }
  }
  const onReview = (ids: string[]) => {
    setEvents((previous) =>
      previous.map((e) => (ids.includes(e.id) ? { ...e, reviewed: true } : e)),
    )
    notify(
      ids.length === 1 ? 'Event marked as reviewed' : `${ids.length} events marked as reviewed`,
    )
  }
  const onSaveCamera = (camera: Camera, isNew: boolean) => {
    setCameras((previous) =>
      isNew ? [...previous, camera] : previous.map((c) => (c.id === camera.id ? camera : c)),
    )
    setDialog(null)
    notify(isNew ? `${camera.name} added to your demo workspace` : 'Camera settings saved')
  }
  const onSaveRule = (rule: DetectionRule, remove = false) => {
    setRules((previous) =>
      remove
        ? previous.filter((r) => r.id !== rule.id)
        : previous.some((r) => r.id === rule.id)
          ? previous.map((r) => (r.id === rule.id ? rule : r))
          : [...previous, rule],
    )
    setDialog(null)
    notify(remove ? 'Detection rule deleted' : 'Detection rule saved')
  }
  const onSelectRecording = (cameraId: string, type: EventType) => {
    const recording =
      initialRecordings.find((r) => r.cameraId === cameraId && r.type === type) ??
      initialRecordings.find((r) => r.cameraId === cameraId)
    if (!recording) {
      notify('No sample recordings for this camera yet')
      return
    }
    setSelectedRecording(recording.id)
    navigate('recordings')
  }
  const siteCameras = cameras.filter(
    (c) =>
      (site === 'All locations' || c.location === site) &&
      (location === 'all' || c.location === location),
  )
  const commonWall = {
    timezone: preferences.timezone,
    onExpand: (id: string) => setDialog({ type: 'camera' as const, id }),
    onSnapshot,
  }
  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <Sidebar
        page={page}
        navigate={navigate}
        alertCount={alertCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        name={preferences.name}
        workspace={preferences.workspace}
        onHelp={() => setDialog({ type: 'help' })}
      />
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <LayoutGrid size={16} />
              <span>Workspace</span>
              <ChevronRight size={13} />
              <strong>{pageNames[page]}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <button className="global-search-button" onClick={() => setDialog({ type: 'search' })}>
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <span className="topbar-divider" />
            <span className="system-status">
              <span className="status-dot" />
              System operational
            </span>
            <button
              className="icon-button topbar-help"
              title="Help & getting started"
              aria-label="Help & getting started"
              onClick={() => setDialog({ type: 'help' })}
            >
              <CircleHelp size={19} />
            </button>
            <div className="notification-container" ref={notificationRef}>
              <button
                className={`icon-button notification-button ${notificationsOpen ? 'is-active' : ''}`}
                aria-label={`Notifications, ${alertCount} alerts need review`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={19} />
                {alertCount > 0 && <span />}
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <h3>Notifications</h3>
                    <Badge tone="amber">{alertCount} new</Badge>
                  </div>
                  <p className="popover-subtitle">A few things to keep an eye on.</p>
                  {events
                    .filter((e) => e.alert && !e.reviewed)
                    .slice(0, 4)
                    .map((e) => (
                      <button
                        className="notification-item"
                        key={e.id}
                        onClick={() => {
                          setDialog({ type: 'event', id: e.id })
                          setNotificationsOpen(false)
                        }}
                      >
                        <span
                          className={`notification-dot ${e.severity === 'critical' ? 'notification-critical' : ''}`}
                        />
                        <span>
                          <strong>{e.title}</strong>
                          <small>
                            {cameras.find((c) => c.id === e.cameraId)?.name} · {e.minutesAgo} min
                            ago
                          </small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  {alertCount === 0 && (
                    <div className="notifications-clear">
                      <ShieldCheck size={28} />
                      <strong>You’re all caught up.</strong>
                      <span>All sample alerts have been reviewed.</span>
                    </div>
                  )}
                  <div className="notification-footer">
                    <button
                      className="text-button"
                      disabled={!alertCount}
                      onClick={() => onReview(events.filter((e) => e.alert).map((e) => e.id))}
                    >
                      <CheckCheck size={14} /> Mark all reviewed
                    </button>
                    <button className="text-button" onClick={() => navigate('events')}>
                      View all <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              className="topbar-avatar avatar"
              onClick={() => navigate('settings')}
              aria-label="Open profile settings"
            >
              {preferences.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={`main-content page-${page}`}>
          {page === 'overview' && (
            <>
              <PageHeading
                title="Overview"
                subtitle={`Welcome back, ${preferences.name.trim().split(' ')[0] || 'there'}. Here’s what’s happening around your spaces.`}
              >
                <div className="workspace-picker" ref={workspaceRef}>
                  <button
                    className="button button-secondary site-picker"
                    onClick={() => setWorkspaceOpen(!workspaceOpen)}
                    aria-expanded={workspaceOpen}
                  >
                    <span className="status-dot" />
                    {site}
                    <ChevronDown size={14} />
                  </button>
                  {workspaceOpen && (
                    <div className="workspace-popover">
                      <span>VIEW LOCATION</span>
                      {['All locations', 'Main building', 'Outdoors', 'Warehouse'].map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setSite(l)
                            setLocation('all')
                            setWorkspaceOpen(false)
                          }}
                        >
                          {l}
                          {site === l && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="button button-primary"
                  onClick={() => setDialog({ type: 'add-camera' })}
                >
                  <Plus size={17} /> Add camera
                </button>
              </PageHeading>
              <div className="overview-meta">
                <span>
                  <CalendarDays size={14} />
                  Sunday, November 1, 2026
                </span>
                <Badge tone="neutral">
                  <span className="demo-dot" />
                  Demo workspace
                </Badge>
              </div>
              <Stats
                cameras={cameras.filter((c) => site === 'All locations' || c.location === site)}
                events={events.filter(
                  (e) =>
                    site === 'All locations' ||
                    cameras.find((c) => c.id === e.cameraId)?.location === site,
                )}
                navigate={navigate}
              />
              <div className="dashboard-grid">
                <div className="dashboard-primary">
                  <CameraWall
                    cameras={siteCameras}
                    {...commonWall}
                    onViewAll={() => {
                      setLocation(site === 'All locations' ? 'all' : site)
                      navigate('live')
                    }}
                  />
                  <section className="panel recent-recordings">
                    <div className="panel-heading">
                      <div className="panel-title">
                        <h2>Recent recordings</h2>
                        <span className="subtle-count">{initialRecordings.length} clips</span>
                      </div>
                      <button className="text-button" onClick={() => navigate('recordings')}>
                        View library <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="recent-recordings-grid">
                      {initialRecordings
                        .slice(0, 3)
                        .filter(
                          (r) =>
                            site === 'All locations' ||
                            cameras.find((c) => c.id === r.cameraId)?.location === site,
                        )
                        .map((recording) => {
                          const camera =
                            cameras.find((c) => c.id === recording.cameraId) ?? cameras[0]
                          return (
                            <button
                              className="recent-recording"
                              key={recording.id}
                              onClick={() => {
                                setSelectedRecording(recording.id)
                                navigate('recordings')
                              }}
                            >
                              <div className="recent-recording-image">
                                <img
                                  src={camera.image}
                                  alt={`Sample recording of ${camera.name}`}
                                />
                                <span className="recording-mini-tag">
                                  <Film size={10} />
                                  EVENT
                                </span>
                                <span className="recent-recording-play">
                                  <Play size={15} fill="currentColor" />
                                </span>
                                <span className="recording-duration">
                                  {formatDuration(recording.duration)}
                                </span>
                              </div>
                              <div className="recent-recording-text">
                                <strong>{camera.name}</strong>
                                <span>
                                  {recording.title}
                                  <small>Today, {recording.time}</small>
                                </span>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </section>
                  <div className="overview-bottom-note">
                    <ShieldCheck size={14} />
                    <span>Built for awareness. Designed for peace of mind.</span>
                    <span>Vigil v0.1 · Interface preview</span>
                  </div>
                </div>
                <aside className="dashboard-secondary">
                  <ActivityPanel
                    events={events.filter(
                      (e) =>
                        site === 'All locations' ||
                        cameras.find((c) => c.id === e.cameraId)?.location === site,
                    )}
                    cameras={cameras}
                    onEvent={(id) => setDialog({ type: 'event', id })}
                    onViewAll={() => navigate('events')}
                  />
                  <section className="panel intelligence-card">
                    <div className="intelligence-card-top">
                      <span>
                        <Sparkles size={17} /> Intelligence, at work
                      </span>
                      <Badge tone="green">AI enabled</Badge>
                    </div>
                    <div className="intelligence-metrics">
                      <div>
                        <strong>128</strong>
                        <span>Detections today</span>
                      </div>
                      <span />
                      <div>
                        <strong>
                          96.8<small>%</small>
                        </strong>
                        <span>Avg. confidence</span>
                      </div>
                    </div>
                    <div className="intelligence-bar">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="intelligence-legend">
                      <span>
                        <i />
                        People 54%
                      </span>
                      <span>
                        <i />
                        Vehicles 28%
                      </span>
                      <span>
                        <i />
                        Other 18%
                      </span>
                    </div>
                    <button onClick={() => navigate('analytics')}>
                      Explore analytics <ArrowRight size={14} />
                    </button>
                  </section>
                  <HealthCard />
                </aside>
              </div>
            </>
          )}
          {page === 'live' && (
            <>
              <PageHeading title="Live view" subtitle="More perspective. Less blind spots.">
                <Badge tone="neutral">
                  <span className="demo-dot" />
                  Demo workspace
                </Badge>
                <button
                  className="button button-primary"
                  onClick={() => setDialog({ type: 'add-camera' })}
                >
                  <Plus size={17} />
                  Add camera
                </button>
              </PageHeading>
              <CameraWall
                cameras={siteCameras}
                {...commonWall}
                full
                location={location}
                onLocationChange={setLocation}
              />
              <div className="live-bottom">
                <HealthCard />
                <div className="live-tip">
                  <Sparkles size={19} />
                  <span>
                    <strong>A closer look, one click away.</strong> Select a camera to focus, or
                    expand it for details and recent activity.
                  </span>
                </div>
              </div>
            </>
          )}
          {page === 'events' && (
            <EventsPage
              events={events}
              cameras={cameras}
              onEvent={(id) => setDialog({ type: 'event', id })}
              onReview={onReview}
              notify={notify}
            />
          )}
          {page === 'recordings' && (
            <RecordingsPage
              retention={preferences.retention}
              recordings={initialRecordings}
              cameras={cameras}
              selectedId={selectedRecording}
              onSelect={setSelectedRecording}
              onSnapshot={onSnapshot}
              onExpand={(id) => setDialog({ type: 'camera', id })}
            />
          )}
          {page === 'analytics' && (
            <AnalyticsPage cameras={cameras} events={events} navigate={navigate} notify={notify} />
          )}
          {page === 'cameras' && (
            <CamerasPage
              cameras={cameras}
              onAdd={() => setDialog({ type: 'add-camera' })}
              onEdit={(id) => setDialog({ type: 'edit-camera', id })}
              onExpand={(id) => setDialog({ type: 'camera', id })}
              onToggle={(id, online) => {
                setCameras((previous) => previous.map((c) => (c.id === id ? { ...c, online } : c)))
                notify(online ? 'Demo camera enabled' : 'Demo camera paused')
              }}
            />
          )}
          {page === 'rules' && (
            <RulesPage
              rules={rules}
              cameras={cameras}
              onAdd={() => setDialog({ type: 'rule' })}
              onEdit={(id) => setDialog({ type: 'rule', id })}
              onToggle={(id, enabled) => {
                setRules((previous) => previous.map((r) => (r.id === id ? { ...r, enabled } : r)))
                notify(enabled ? 'Detection rule enabled' : 'Detection rule paused')
              }}
            />
          )}
          {page === 'settings' && (
            <SettingsPage
              preferences={preferences}
              onSave={(p) => {
                setPreferences(p)
                notify('Workspace preferences saved')
              }}
            />
          )}
        </main>
      </div>
      <Dialogs
        defaultConfidence={preferences.confidence}
        dialog={dialog}
        cameras={cameras}
        events={events}
        rules={rules}
        recordings={initialRecordings}
        onClose={() => setDialog(null)}
        setDialog={setDialog}
        navigate={navigate}
        onSaveCamera={onSaveCamera}
        onSnapshot={onSnapshot}
        onReview={onReview}
        onSaveRule={onSaveRule}
        onSelectRecording={onSelectRecording}
      />
      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>
            <Check size={16} />
          </span>
          <p>{toast.message}</p>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
