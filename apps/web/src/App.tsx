import { formatTime } from './format';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Bell,
  Camera as CameraIcon,
  CircleHelp,
  ClipboardCheck,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ApiError,
  api,
  get,
  setCsrf,
  type Camera,
  type EventPage,
  type Group,
  type Health,
  type Incident,
  type Items,
  type SecurityEvent,
  type Session,
  type Summary,
} from './api/client';
import {
  cameraNames,
  eventNames,
  groupNames,
  translations,
  type Locale,
  type TranslationKey,
} from './i18n';
import { Login } from './components/Login';
import { CameraCard } from './components/CameraCard';
import { CameraDetail } from './components/CameraDetail';
import { EventReview } from './components/EventReview';
import {
  EmptyState,
  Modal,
  SimulationNotice,
  ErrorState,
  Loading,
  StatusBadge,
  Toast,
} from './components/ui';
import { Administration } from './components/Administration';

type Page = 'overview' | 'cameras' | 'events' | 'incidents' | 'administration';
const nav = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'cameras', icon: CameraIcon },
  { id: 'events', icon: Activity },
  { id: 'incidents', icon: ShieldCheck },
  { id: 'administration', icon: Settings2 },
] as const;
export function App() {
  const client = useQueryClient();
  const navigationRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [locale, updateLocale] = useState<Locale>(() =>
    localStorage.getItem('iesmmg-locale') === 'es' ? 'es' : 'en',
  );
  const [page, setPage] = useState<Page>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [cameraFilter, setCameraFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [severity, setSeverity] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [toast, setToast] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [about, setAbout] = useState(false);
  const [connected, setConnected] = useState(false);
  const [layout, setLayout] = useState(
    () => localStorage.getItem('iesmmg-layout') || 'comfortable',
  );
  const t = (key: TranslationKey) => translations[locale][key];
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const s = await get<Session>('/auth/session');
        setCsrf(s.csrf_token);
        return s;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchInterval: 60_000,
  });
  const user = sessionQuery.data?.user;
  const enabled = !!user;
  const camerasQuery = useQuery({
    queryKey: ['cameras'],
    queryFn: () => get<Items<Camera>>('/cameras'),
    enabled,
  });
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => get<Items<Group>>('/camera-groups'),
    enabled,
  });
  const summaryQuery = useQuery({
    queryKey: ['summary'],
    queryFn: () => get<Summary>('/system/summary'),
    enabled,
    refetchInterval: 30000,
  });
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => get<Health>('/system/health'),
    enabled,
    refetchInterval: 30000,
  });
  const eventQuery = useInfiniteQuery({
    queryKey: ['events', cameraFilter, severity, reviewFilter],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '50' });
      if (cameraFilter) params.set('camera_id', cameraFilter);
      if (severity) params.set('severity', severity);
      if (reviewFilter) params.set('review_status', reviewFilter);
      if (pageParam) params.set('cursor', pageParam);
      return get<EventPage>(`/events?${params}`);
    },
    initialPageParam: '',
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    refetchInterval: 30_000,
  });
  const incidentsQuery = useQuery({
    queryKey: ['incidents'],
    queryFn: () => get<Items<Incident>>('/incidents'),
    enabled,
  });
  const cameras = camerasQuery.data?.items || [];
  // Refetching cursor pages after an insertion can overlap; stable IDs prevent duplicate rows.
  const events = Array.from(
    new Map(
      eventQuery.data?.pages.flatMap((page) => page.items).map((event) => [event.id, event]),
    ).values(),
  );
  const pendingQuery = useQuery({
    queryKey: ['pending-preview'],
    queryFn: () => get<EventPage>('/events?review_status=pending&limit=4'),
    enabled,
    refetchInterval: 30_000,
  });
  const pending = pendingQuery.data?.items ?? [];
  const summary = summaryQuery.data;
  const clearToast = useCallback(() => setToast(''), []);
  const navigate = (next: Page) => {
    setPage(next);
    setMobileNav(false);
    setNotifications(false);
  };
  useEffect(() => {
    if (!mobileNav) return;
    const menuButton = menuRef.current;
    const controls = () =>
      Array.from(navigationRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? []);
    controls()
      .find((element) => element.classList.contains('active'))
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNav(false);
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = matchMedia('(min-width: 761px)');
    const onResize = () => {
      if (desktop.matches) setMobileNav(false);
    };
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
      menuButton?.focus();
    };
  }, [mobileNav]);
  const setLocale = (value: Locale) => {
    updateLocale(value);
    localStorage.setItem('iesmmg-locale', value);
  };
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `IESMMG · ${translations[locale][user ? page : 'login']}`;
  }, [locale, page, user]);
  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource('/api/v1/system/event-updates', { withCredentials: true });
    source.onopen = () => setConnected(true);
    source.addEventListener('update', () => {
      for (const key of ['events', 'pending-preview', 'summary', 'cameras', 'incidents'])
        void client.invalidateQueries({ queryKey: [key] });
    });
    source.onerror = () => setConnected(false);
    return () => {
      source.close();
      setConnected(false);
    };
  }, [enabled, client]);
  useEffect(() => {
    if (!sessionQuery.error) return;
    setToast(sessionQuery.error.message);
  }, [sessionQuery.error]);
  async function signOut() {
    try {
      await api('/auth/session', { method: 'DELETE' });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setToast(e instanceof Error ? e.message : t('error'));
        return;
      }
    }
    await client.cancelQueries();
    client.clear();
    setCsrf('');
    setPage('overview');
    await sessionQuery.refetch();
  }
  function loginSuccess(session: Session) {
    setSelectedCamera(null);
    setSelectedEvent(null);
    setNotifications(false);
    setToast('');
    setPage('overview');
    setCsrf(session.csrf_token);
    client.setQueryData(['session'], session);
  }
  if (sessionQuery.isLoading)
    return (
      <div className="app-loading">
        <span className="wordmark">
          IES<span>MMG</span>
        </span>
        <Loading text={t('loading')} />
      </div>
    );
  if (sessionQuery.isError)
    return (
      <div className="app-loading">
        <ErrorState t={t} retry={() => void sessionQuery.refetch()} />
      </div>
    );
  if (!user) return <Login locale={locale} setLocale={setLocale} success={loginSuccess} />;
  const visibleCameras = cameras.filter(
    (c) =>
      `${c.name} ${cameraNames[c.name] || ''} ${c.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!groupFilter || c.group_id === groupFilter),
  );
  const canReview = user.permissions.includes('event:review');
  const openEvent = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setNotifications(false);
  };
  const showAllCameras = () => {
    setGroupFilter('');
    setSearch('');
    navigate('cameras');
  };
  const showPending = () => {
    setCameraFilter('');
    setSeverity('');
    setReviewFilter('pending');
    navigate('events');
  };
  const showAllEvents = () => {
    setCameraFilter('');
    setSeverity('');
    setReviewFilter('');
    navigate('events');
  };
  const openIncidentEvent = async (id: string) => {
    try {
      openEvent(await get<SecurityEvent>(`/events/${id}`));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t('error'));
    }
  };
  const cameraLabel = (id: string) => {
    const name = cameras.find((camera) => camera.id === id)?.name;
    return name ? (locale === 'es' ? cameraNames[name] || name : name) : '—';
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('skipContent')}
      </a>
      {mobileNav && (
        <button
          className="nav-backdrop"
          onClick={() => setMobileNav(false)}
          aria-label={t('close')}
        />
      )}
      <aside ref={navigationRef} className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <a
          className="wordmark wordmark-light"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('overview');
          }}
        >
          IES<span>MMG</span>
          <i />
        </a>
        <span className="brand-subtitle">INTELLIGENT SECURITY</span>
        <div className="workspace-selector">
          <span className="workspace-icon">
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>IES Manuel Martín</strong>
            <small>González · {t('prototype')}</small>
          </div>
        </div>
        <span className="nav-label">{t('workspace')}</span>
        <nav id="workspace-navigation" aria-label={t('workspace')}>
          {nav
            .filter((item) => item.id !== 'administration' || user.role === 'administrator')
            .map(({ id, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item ${page === id ? 'active' : ''}`}
                onClick={() => navigate(id)}
                aria-current={page === id ? 'page' : undefined}
              >
                <Icon size={19} />
                <span>{t(id)}</span>
                {id === 'events' && !!summary?.pending_reviews && (
                  <b className="nav-count">{summary.pending_reviews}</b>
                )}
                {id === 'incidents' && !!summary?.confirmed_incidents && (
                  <b className="nav-count">{summary.confirmed_incidents}</b>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-health">
            <span className="health-pulse" />
            <div>
              <strong>{t('simulation')}</strong>
              <small>{t('privacyFirst')}</small>
            </div>
            <ShieldCheck size={17} />
          </div>
          <button className="nav-item" onClick={() => setAbout(true)}>
            <CircleHelp size={18} />
            <span>{t('help')}</span>
          </button>
          <div className="sidebar-version">
            <span className="version-dot" />
            {t('version')}
            <span>IESMMG</span>
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={mobileNav}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuRef}
              className="icon-btn mobile-menu"
              aria-expanded={mobileNav}
              aria-controls="workspace-navigation"
              onClick={() => setMobileNav(true)}
              aria-label={t('menu')}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              <span className="breadcrumb-parent">{t('workspace')}</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{t(page)}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label={t('search')}
                placeholder={t('search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value) setPage('cameras');
                }}
              />
            </div>
            <div className="locale-switch" role="group" aria-label={t('language')}>
              <Globe2 size={15} />
              <button
                className={locale === 'en' ? 'active' : ''}
                aria-pressed={locale === 'en'}
                onClick={() => setLocale('en')}
              >
                EN
              </button>
              <button
                className={locale === 'es' ? 'active' : ''}
                aria-pressed={locale === 'es'}
                onClick={() => setLocale('es')}
              >
                ES
              </button>
            </div>
            <div className="notification-wrap">
              <button
                className={`icon-btn notification-button ${notifications ? 'selected' : ''}`}
                onClick={() => setNotifications(!notifications)}
                aria-label={t('notifications')}
                aria-expanded={notifications}
              >
                <Bell size={20} />
                {pending.length > 0 && <span />}
              </button>
              {notifications && (
                <div className="notification-panel">
                  <div className="panel-title">
                    <h3>{t('notifications')}</h3>
                    <span className="count-pill">{summary?.pending_reviews ?? pending.length}</span>
                  </div>
                  <p className="simulation-small">{t('simulation')}</p>
                  {pendingQuery.isLoading && <Loading text={t('loading')} />}
                  {pendingQuery.isError && (
                    <ErrorState t={t} retry={() => void pendingQuery.refetch()} />
                  )}
                  {pending.slice(0, 4).map((event) => (
                    <button key={event.id} onClick={() => openEvent(event)}>
                      <span className={`severity-marker severity-${event.severity}`} />
                      <span>
                        <strong>
                          {locale === 'es' ? eventNames[event.kind] || event.kind : event.kind}
                        </strong>
                        <small>
                          {cameraLabel(event.camera_id)} · {formatTime(event.observed_at, locale)}
                        </small>
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                  {!pendingQuery.isLoading && !pendingQuery.isError && pending.length === 0 && (
                    <p className="muted panel-empty">{t('noEvents')}</p>
                  )}
                  <button className="notification-footer" onClick={showPending}>
                    {t('reviewQueue')}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
            <div className="user-menu">
              <span className="avatar">
                {user.display_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
              <div>
                <strong>{user.display_name}</strong>
                <small>{t(user.role)}</small>
              </div>
              <button className="icon-btn" onClick={() => void signOut()} aria-label={t('signOut')}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className="environment-bar">
            <span>
              <span className="demo-dot" />
              {t('simulation')}
            </span>
            <p>{t('demoNotice')}</p>
            <span className="environment-tag">DEMO</span>
          </div>
          <div className="page-heading">
            <div>
              <div className="section-kicker">
                {t('workspace')}
                <span>·</span>
                {new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date())}
              </div>
              <h1>{page === 'overview' ? t('greeting') : t(page)}</h1>
              <p>
                {t(
                  page === 'overview'
                    ? 'overviewSub'
                    : page === 'incidents'
                      ? 'incidentSub'
                      : page === 'administration'
                        ? 'adminSub'
                        : page === 'events'
                          ? 'reviewNotice'
                          : 'demoNotice',
                )}
              </p>
            </div>
            <div className="connection-state">
              <span className={connected ? 'connected-dot' : 'polling-dot'} />
              {t(connected ? 'connectionUpdates' : 'pollingUpdates')}
            </div>
          </div>
          {(page === 'overview' || page === 'cameras') && (
            <>
              {page === 'overview' && (
                <div className="stat-grid">
                  <Stat
                    label={t('totalCameras')}
                    value={summary?.cameras_total}
                    icon={<CameraIcon size={20} />}
                    detail={
                      <>
                        <span className="tiny-dot green" />
                        {summary?.cameras_online || 0} {t('online').toLowerCase()}
                        <span className="stat-separator">·</span>
                        {t('simulation')}
                      </>
                    }
                    color="teal"
                    onClick={showAllCameras}
                  />
                  <Stat
                    label={t('pendingReview')}
                    value={summary?.pending_reviews}
                    icon={<ClipboardCheck size={20} />}
                    detail={
                      <>
                        <span className="tiny-dot amber" />
                        {t('eventsCopy')}
                      </>
                    }
                    color="amber"
                    onClick={showPending}
                  />
                  <Stat
                    label={t('confirmedIncidents')}
                    value={summary?.confirmed_incidents}
                    icon={<ShieldCheck size={20} />}
                    detail={
                      <>
                        <ShieldCheck size={12} />
                        {t('humanConfirmation')}
                      </>
                    }
                    color="blue"
                    onClick={() => navigate('incidents')}
                  />
                  <Stat
                    label={t('needsAttention')}
                    value={(summary?.cameras_degraded || 0) + (summary?.cameras_offline || 0)}
                    icon={<Activity size={20} />}
                    detail={
                      <>
                        <span className="tiny-dot red" />
                        {t('attentionCopy')}
                      </>
                    }
                    color="rose"
                    onClick={showAllCameras}
                  />
                </div>
              )}
              <div className={page === 'overview' ? 'overview-layout' : ''}>
                <section className="camera-section">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {t(page === 'overview' ? 'liveOverview' : 'allCameras')}
                        <span className="count-pill">{visibleCameras.length}</span>
                      </h2>
                      {page === 'overview' && (
                        <p>
                          <span className="tiny-dot green" />
                          {summary?.cameras_online || 0} {t('online').toLowerCase()}
                          <span>·</span>
                          {t('syntheticFeed')}
                        </p>
                      )}
                    </div>
                    <div className="section-tools">
                      <select
                        aria-label={t('group')}
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                      >
                        <option value="">{t('allGroups')}</option>
                        {groupsQuery.data?.items.map((group) => (
                          <option key={group.id} value={group.id}>
                            {locale === 'es' ? groupNames[group.name] || group.name : group.name}
                          </option>
                        ))}
                      </select>
                      <div className="view-toggle" role="group" aria-label={t('layout')}>
                        <button
                          className={layout === 'comfortable' ? 'active' : ''}
                          aria-pressed={layout === 'comfortable'}
                          onClick={() => {
                            setLayout('comfortable');
                            localStorage.setItem('iesmmg-layout', 'comfortable');
                          }}
                          aria-label={t('gridView')}
                        >
                          <LayoutDashboard size={16} />
                        </button>
                        <button
                          className={layout === 'compact' ? 'active' : ''}
                          aria-pressed={layout === 'compact'}
                          onClick={() => {
                            setLayout('compact');
                            localStorage.setItem('iesmmg-layout', 'compact');
                          }}
                          aria-label={t('listView')}
                        >
                          <Menu size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {camerasQuery.isLoading ? (
                    <Loading text={t('loading')} />
                  ) : camerasQuery.isError ? (
                    <ErrorState t={t} retry={() => void camerasQuery.refetch()} />
                  ) : visibleCameras.length === 0 ? (
                    <EmptyState
                      icon={CameraIcon}
                      title={t('noCameras')}
                      description={t('noCamerasSub')}
                    />
                  ) : (
                    <div
                      className={`camera-grid ${layout === 'compact' ? 'compact-grid' : ''} ${page === 'cameras' ? 'full-camera-grid' : ''}`}
                    >
                      {(page === 'overview' ? visibleCameras.slice(0, 6) : visibleCameras).map(
                        (camera) => (
                          <CameraCard
                            key={camera.id}
                            camera={camera}
                            open={() => setSelectedCamera(camera)}
                            t={t}
                            locale={locale}
                            compact={layout === 'compact'}
                          />
                        ),
                      )}
                    </div>
                  )}
                  {page === 'overview' && visibleCameras.length > 6 && (
                    <button className="view-all-cameras" onClick={showAllCameras}>
                      {t('viewAll')} {cameras.length} {t('cameras').toLowerCase()}
                      <ArrowRight size={15} />
                    </button>
                  )}
                </section>
                {page === 'overview' && (
                  <aside className="activity-column">
                    <section className="panel recent-panel">
                      <div className="panel-title">
                        <h2>{t('recentEvents')}</h2>
                        <button className="text-btn" onClick={showAllEvents}>
                          {t('viewAll')}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="activity-label">
                        <span className="tiny-dot amber" />
                        {t('reviewQueue')}
                        <span className="count-pill">
                          {summary?.pending_reviews ?? pending.length}
                        </span>
                      </div>
                      <div className="recent-events">
                        {eventQuery.isLoading ? (
                          <Loading text={t('loading')} />
                        ) : eventQuery.isError ? (
                          <ErrorState t={t} retry={() => void eventQuery.refetch()} />
                        ) : (
                          events.slice(0, 5).map((event) => (
                            <button
                              className="recent-event"
                              key={event.id}
                              onClick={() => openEvent(event)}
                            >
                              <span className={`event-icon event-icon-${event.severity}`}>
                                {event.category === 'connection' ? (
                                  <Activity size={16} />
                                ) : event.category === 'vehicle' ? (
                                  <CameraIcon size={16} />
                                ) : (
                                  <ShieldCheck size={16} />
                                )}
                              </span>
                              <span className="recent-event-content">
                                <strong>
                                  {locale === 'es'
                                    ? eventNames[event.kind] || event.kind
                                    : event.kind}
                                </strong>
                                <small>{cameraLabel(event.camera_id)}</small>
                                <span>
                                  <time>{formatTime(event.observed_at, locale)}</time>
                                  <span className={`severity-text severity-text-${event.severity}`}>
                                    {t(event.severity as TranslationKey)}
                                  </span>
                                </span>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                      <button className="panel-bottom-link" onClick={showAllEvents}>
                        {t('allEvents')}
                        <ArrowRight size={15} />
                      </button>
                    </section>
                    <HealthPanel health={healthQuery.data} t={t} />
                  </aside>
                )}
              </div>
            </>
          )}
          {page === 'events' && (
            <section className="panel events-panel">
              <div className="table-toolbar">
                <div>
                  <h2>
                    {t('allEvents')}
                    <span className="count-pill">{events.length}</span>
                  </h2>
                  <p>{t('scoreNote')}</p>
                </div>
                <div className="filter-controls">
                  <select
                    aria-label={t('selectCamera')}
                    value={cameraFilter}
                    onChange={(e) => setCameraFilter(e.target.value)}
                  >
                    <option value="">{t('allCameras')}</option>
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === 'es' ? cameraNames[c.name] || c.name : c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={t('severity')}
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="">{t('allSeverities')}</option>
                    {['critical', 'high', 'medium', 'low'].map((s) => (
                      <option key={s} value={s}>
                        {t(s as TranslationKey)}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={t('review')}
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value)}
                  >
                    <option value="">{t('allStatuses')}</option>
                    {['pending', 'false_positive', 'needs_investigation', 'confirmed'].map((s) => (
                      <option key={s} value={s}>
                        {t(s as TranslationKey)}
                      </option>
                    ))}
                  </select>
                  {(cameraFilter || severity || reviewFilter) && (
                    <button
                      className="text-btn"
                      onClick={() => {
                        setCameraFilter('');
                        setSeverity('');
                        setReviewFilter('');
                      }}
                    >
                      {t('clearFilters')}
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              {eventQuery.isLoading ? (
                <Loading text={t('loading')} />
              ) : eventQuery.isError ? (
                <ErrorState t={t} retry={() => void eventQuery.refetch()} />
              ) : events.length === 0 ? (
                <EmptyState icon={Activity} title={t('noEvents')} description={t('noEventsSub')} />
              ) : (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={t('allEvents')}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>{t('detection')}</th>
                        <th>{t('selectCamera')}</th>
                        <th>{t('severity')}</th>
                        <th>{t('confidence')}</th>
                        <th>{t('time')}</th>
                        <th>{t('status')}</th>
                        <th>
                          <span className="sr-only">{t('review')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <button className="table-event-name" onClick={() => openEvent(event)}>
                              <span className={`event-icon event-icon-${event.severity}`}>
                                <Activity size={16} />
                              </span>
                              <span>
                                <strong>
                                  {locale === 'es'
                                    ? eventNames[event.kind] || event.kind
                                    : event.kind}
                                </strong>
                                <small>
                                  {t('eventSource')} · {t(event.category as TranslationKey)}
                                </small>
                              </span>
                            </button>
                          </td>
                          <td>{cameraLabel(event.camera_id)}</td>
                          <td>
                            <StatusBadge status={event.severity} t={t} />
                          </td>
                          <td>
                            {event.confidence == null
                              ? '—'
                              : `${Math.round(event.confidence * 100)}%`}
                          </td>
                          <td className="nowrap">{formatTime(event.observed_at, locale)}</td>
                          <td>
                            <StatusBadge status={event.review_status} t={t} />
                          </td>
                          <td>
                            <button
                              className="icon-btn"
                              onClick={() => openEvent(event)}
                              aria-label={`${t('reviewEvent')}: ${locale === 'es' ? eventNames[event.kind] || event.kind : event.kind}`}
                            >
                              <ArrowRight size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="table-footer">
                <span>
                  {t('showing')} {events.length} · {t('simulation')} · UTC
                </span>
                {eventQuery.hasNextPage && (
                  <button
                    className="btn btn-secondary"
                    disabled={eventQuery.isFetchingNextPage}
                    onClick={() => void eventQuery.fetchNextPage()}
                  >
                    {eventQuery.isFetchingNextPage ? t('loading') : t('loadMore')}
                  </button>
                )}
              </div>
              {eventQuery.isFetchNextPageError && (
                <ErrorState
                  t={t}
                  message={eventQuery.error.message}
                  retry={() => void eventQuery.fetchNextPage()}
                />
              )}
            </section>
          )}
          {page === 'incidents' && (
            <section className="incidents-section">
              <p className="history-limit">{t('recentRecords')}</p>
              <div className="info-callout incident-callout">
                <ShieldCheck size={21} />
                <p>{t('incidentSub')}</p>
              </div>
              {incidentsQuery.isLoading ? (
                <Loading text={t('loading')} />
              ) : incidentsQuery.isError ? (
                <ErrorState t={t} retry={() => void incidentsQuery.refetch()} />
              ) : !incidentsQuery.data?.items.length ? (
                <div className="panel">
                  <EmptyState
                    icon={ShieldCheck}
                    title={t('noIncidents')}
                    description={t('noIncidentsSub')}
                    action={
                      <button className="btn btn-primary" onClick={showPending}>
                        {t('reviewQueue')}
                        <ArrowRight size={16} />
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="incident-grid">
                  {incidentsQuery.data.items.map((incident) => (
                    <article className="panel incident-card" key={incident.id}>
                      <div>
                        <span className="section-kicker">
                          {t('incidentRecord')} · {incident.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={incident.severity} t={t} />
                      </div>
                      <h2>{incident.title}</h2>
                      <p>{incident.rationale}</p>
                      <div className="incident-meta">
                        <span>
                          <CameraIcon size={15} />
                          {cameraLabel(incident.camera_id)}
                        </span>
                        <time>{formatTime(incident.confirmed_at, locale, true)}</time>
                      </div>
                      <div className="incident-confirmation">
                        <ShieldCheck size={17} />
                        <span>
                          {t('humanConfirmation')} · {incident.confirmed_by.slice(0, 8)}
                        </span>
                        <StatusBadge status="confirmed" t={t} />
                      </div>
                      <button
                        className="text-btn"
                        onClick={() => void openIncidentEvent(incident.event_id)}
                      >
                        {t('eventDetails')}
                        <ArrowRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {page === 'administration' &&
            (user.role === 'administrator' ? (
              <Administration
                t={t}
                locale={locale}
                notify={setToast}
                groups={groupsQuery.data?.items || []}
              />
            ) : (
              <EmptyState title={t('accessDenied')} description={t('noPermission')} />
            ))}
          <footer className="main-footer">
            <span>
              <ShieldCheck size={14} />
              IESMMG · {t('privacyFirst')}
            </span>
            <span>{t('brandPending')}</span>
            <button onClick={() => setAbout(true)}>
              {t('help')}
              <ArrowRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {selectedCamera && (
        <CameraDetail
          camera={cameras.find((c) => c.id === selectedCamera.id) || selectedCamera}
          close={() => setSelectedCamera(null)}
          t={t}
          locale={locale}
          canManage={user.permissions.includes('camera:manage')}
          notify={setToast}
        />
      )}
      {selectedEvent && (
        <EventReview
          key={`${selectedEvent.id}-${selectedEvent.version}`}
          event={events.find((e) => e.id === selectedEvent.id) || selectedEvent}
          camera={cameras.find((c) => c.id === selectedEvent.camera_id)}
          close={() => setSelectedEvent(null)}
          t={t}
          locale={locale}
          canReview={canReview}
          saved={setToast}
        />
      )}
      {about && (
        <Modal title={t('help')} t={t} close={() => setAbout(false)}>
          <div className="about-content">
            <span className="wordmark">
              IES<span>MMG</span>
            </span>
            <p>{t('aboutText')}</p>
            <SimulationNotice t={t} />
            <small>{t('brandPending')}</small>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} close={clearToast} t={t} />}
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
  detail,
  color,
  onClick,
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  detail: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button className={`stat-card stat-${color}`} onClick={onClick}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value ?? '—'}</strong>
      <div className="stat-detail">{detail}</div>
    </button>
  );
}
function HealthPanel({ health, t }: { health?: Health; t: (k: TranslationKey) => string }) {
  return (
    <section className="panel health-panel">
      <div className="panel-title">
        <h2>{t('health')}</h2>
        <Activity size={17} />
      </div>
      {[
        ['api', health?.api === 'available' ? 'available' : 'unknown'],
        ['database', health?.database === 'available' ? 'available' : 'unknown'],
        ['gateway', 'notConnected'],
        ['ai', 'notApplicable'],
        ['recording', 'automaticRecording'],
      ].map(([key, value]) => (
        <div className="health-row" key={key}>
          <span>{t(key as TranslationKey)}</span>
          <span className={value === 'available' ? 'health-good' : ''}>
            {value === 'available' && <span className="tiny-dot green" />}
            {t(value as TranslationKey)}
          </span>
        </div>
      ))}
      <div className="health-note">
        <ShieldCheck size={14} />
        {t('demoNotice')}
      </div>
    </section>
  );
}
