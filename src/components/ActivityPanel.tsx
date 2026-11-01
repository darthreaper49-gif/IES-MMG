import { useState } from 'react'
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import type { Camera, DetectionEvent } from '../types'
import { timeAgo } from '../data'
import { Badge, EmptyState, EventIcon } from './ui'

export function ActivityPanel({
  events,
  cameras,
  onEvent,
  onViewAll,
}: {
  events: DetectionEvent[]
  cameras: Camera[]
  onEvent: (id: string) => void
  onViewAll: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'alerts'>('all')
  const alertCount = events.filter((e) => e.alert && !e.reviewed).length
  const shown = events.filter((e) => filter === 'all' || (e.alert && !e.reviewed)).slice(0, 5)
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <h2>Recent activity</h2>
        </div>
        <span className="activity-live">
          <span className="status-dot" /> Live
        </span>
      </div>
      <div className="activity-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All events <span>{events.length}</span>
        </button>
        <button className={filter === 'alerts' ? 'active' : ''} onClick={() => setFilter('alerts')}>
          Alerts <span className="alert-count">{alertCount}</span>
        </button>
      </div>
      <div className="activity-list">
        {shown.length ? (
          shown.map((event) => (
            <button
              className={`activity-item ${event.alert && !event.reviewed ? 'activity-alert' : ''}`}
              key={event.id}
              onClick={() => onEvent(event.id)}
            >
              <span className={`event-icon event-icon-${event.type}`}>
                <EventIcon type={event.type} size={18} />
              </span>
              <span className="activity-content">
                <strong>{event.title}</strong>
                <span>{cameras.find((c) => c.id === event.cameraId)?.name ?? event.cameraId}</span>
                <small>
                  {timeAgo(event.minutesAgo)}
                  {event.alert && !event.reviewed && (
                    <Badge tone={event.severity === 'critical' ? 'red' : 'amber'}>
                      {event.severity === 'critical' ? 'High priority' : 'Review'}
                    </Badge>
                  )}
                  {event.reviewed && <span className="reviewed-dot" title="Reviewed" />}
                </small>
              </span>
              <ChevronRight size={14} className="activity-chevron" />
            </button>
          ))
        ) : (
          <EmptyState title="You're all caught up" description="New alerts will appear here." />
        )}
      </div>
      <button className="activity-view-all" onClick={onViewAll}>
        View all activity <ArrowRight size={15} />
      </button>
      <div className="activity-insight">
        <Sparkles size={17} />
        <p>
          <strong>A smarter watch, a quieter day.</strong>
          <span>AI is monitoring your spaces so you can focus on what’s next.</span>
        </p>
      </div>
    </section>
  )
}
