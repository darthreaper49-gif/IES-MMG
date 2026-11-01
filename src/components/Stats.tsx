import {
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  ScanFace,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import type { Camera as CameraType, DetectionEvent, Page } from '../types'

export function Stats({
  cameras,
  events,
  navigate,
}: {
  cameras: CameraType[]
  events: DetectionEvent[]
  navigate: (page: Page) => void
}) {
  const online = cameras.filter((c) => c.online).length
  const alerts = events.filter((e) => e.alert && !e.reviewed).length
  const stats = [
    {
      label: 'Cameras online',
      value: String(online).padStart(2, '0'),
      suffix: `/ ${String(cameras.length).padStart(2, '0')}`,
      icon: Camera,
      tone: 'green',
      footer:
        online === cameras.length
          ? 'All cameras connected'
          : `${cameras.length - online} cameras paused`,
      trend: `${Math.round((online / Math.max(cameras.length, 1)) * 100)}%`,
      page: 'cameras' as Page,
    },
    {
      label: 'Detections today',
      value: '128',
      suffix: '',
      icon: ScanFace,
      tone: 'blue',
      footer: 'vs. yesterday',
      trend: '+12.3%',
      page: 'analytics' as Page,
    },
    {
      label: 'Active alerts',
      value: String(alerts).padStart(2, '0'),
      suffix: '',
      icon: ShieldAlert,
      tone: 'amber',
      footer: alerts ? 'Awaiting your review' : 'All alerts reviewed',
      trend: alerts ? 'Review now' : 'All clear',
      page: 'events' as Page,
    },
    {
      label: 'System uptime',
      value: '99.9',
      suffix: '%',
      icon: TrendingUp,
      tone: 'purple',
      footer: 'Over the last 30 days',
      trend: 'Healthy',
      page: 'analytics' as Page,
    },
  ]
  return (
    <div className="stats-grid">
      {stats.map((s, index) => (
        <button
          className={`stat-card stat-${s.tone}`}
          key={s.label}
          onClick={() => navigate(s.page)}
        >
          <div className="stat-top">
            <span>{s.label}</span>
            <span className={`stat-icon stat-icon-${s.tone}`}>
              <s.icon size={18} strokeWidth={1.65} />
            </span>
          </div>
          <div className="stat-value">
            {s.value}
            <span>{s.suffix}</span>
            {index === 0 && (
              <span className="mini-camera-bars">
                {cameras.slice(0, 10).map((c) => (
                  <i key={c.id} className={c.online ? '' : 'bar-off'} />
                ))}
              </span>
            )}
            {index === 1 && (
              <svg className="stat-sparkline" viewBox="0 0 100 35" fill="none" aria-hidden="true">
                <path
                  d="M1 29 12 24 22 28 33 16 43 20 54 11 65 15 76 6 87 10 99 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 29 12 24 22 28 33 16 43 20 54 11 65 15 76 6 87 10 99 2V35H1Z"
                  fill="currentColor"
                  opacity=".07"
                />
              </svg>
            )}
            {index === 3 && (
              <span className="uptime-bars">
                {Array.from({ length: 16 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            )}
          </div>
          <div className="stat-footer">
            <span
              className={
                index === 2 && alerts
                  ? 'text-amber'
                  : index === 1 || index === 3
                    ? 'text-green'
                    : ''
              }
            >
              {index === 1 ? (
                <ArrowUpRight size={13} />
              ) : index === 2 ? (
                <ArrowDownRight size={13} />
              ) : (
                <span
                  className={`status-dot ${index === 0 && online !== cameras.length ? 'dot-amber' : ''}`}
                />
              )}
              {s.trend}
            </span>
            <span>{s.footer}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
