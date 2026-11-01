import { useMemo, useState } from 'react'
import { Check, CheckCheck, ChevronRight, Download, Search, SlidersHorizontal } from 'lucide-react'
import type { Camera, DetectionEvent } from '../types'
import { eventLabels, timeAgo } from '../data'
import { Badge, downloadCSV, EmptyState, EventIcon, PageHeading, Select } from '../components/ui'

export function EventsPage({
  events,
  cameras,
  onEvent,
  onReview,
  notify,
}: {
  events: DetectionEvent[]
  cameras: Camera[]
  onEvent: (id: string) => void
  onReview: (ids: string[]) => void
  notify: (message: string) => void
}) {
  const [filter, setFilter] = useState('all')
  const [type, setType] = useState('all')
  const [camera, setCamera] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (filter === 'all' ||
            (filter === 'alerts' && e.alert && !e.reviewed) ||
            (filter === 'reviewed' && e.reviewed)) &&
          (type === 'all' || e.type === type) &&
          (camera === 'all' || e.cameraId === camera) &&
          `${e.title} ${e.id} ${cameras.find((c) => c.id === e.cameraId)?.name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [events, filter, type, camera, search, cameras],
  )
  const allSelected = filtered.length > 0 && filtered.every((e) => selected.includes(e.id))
  const exportEvents = () => {
    downloadCSV('vigil-demo-events.csv', [
      ['Event ID', 'Detection', 'Camera', 'Time', 'Confidence', 'Status', 'Data source'],
      ...filtered.map((e) => [
        e.id,
        e.title,
        cameras.find((c) => c.id === e.cameraId)?.name ?? e.cameraId,
        e.time,
        `${e.confidence}%`,
        e.reviewed ? 'Reviewed' : 'Unreviewed',
        'DEMO',
      ]),
    ])
    notify(`Exported ${filtered.length} demo events`)
  }
  return (
    <>
      <PageHeading title="Events & alerts" subtitle="The moments that matter, all in one place.">
        <button className="button button-secondary" onClick={exportEvents}>
          <Download size={16} /> Export events
        </button>
      </PageHeading>
      <div className="event-summary">
        <div>
          <span className="summary-icon summary-green">
            <CheckCheck size={22} />
          </span>
          <span>
            <strong>{events.filter((e) => e.reviewed).length}</strong>
            <small>Reviewed events</small>
          </span>
        </div>
        <div>
          <span className="summary-icon summary-amber">
            <SlidersHorizontal size={22} />
          </span>
          <span>
            <strong>{events.filter((e) => e.alert && !e.reviewed).length}</strong>
            <small>Alerts to review</small>
          </span>
        </div>
        <p>
          Stay informed, not overwhelmed.
          <br />
          <span>Review sample detections and keep your workspace up to date.</span>
        </p>
      </div>
      <section className="panel events-table-panel">
        <div className="table-toolbar">
          <div className="line-tabs">
            {[
              ['all', 'All events'],
              ['alerts', 'Needs review'],
              ['reviewed', 'Reviewed'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? 'active' : ''}
                onClick={() => {
                  setFilter(value)
                  setSelected([])
                }}
              >
                {label}
                {value === 'alerts' && (
                  <span>{events.filter((e) => e.alert && !e.reviewed).length}</span>
                )}
              </button>
            ))}
          </div>
          <span className="table-source">
            <span className="demo-dot" /> Sample event data
          </span>
        </div>
        <div className="table-filters">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search events or cameras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
          </label>
          <Select
            label="Filter by detection type"
            value={type}
            onChange={(v) => {
              setType(v)
              setSelected([])
            }}
            options={[
              { value: 'all', label: 'All detections' },
              ...Object.entries(eventLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            label="Filter by camera"
            value={camera}
            onChange={(v) => {
              setCamera(v)
              setSelected([])
            }}
            options={[
              { value: 'all', label: 'All cameras' },
              ...cameras.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          {selected.length > 0 && (
            <button
              className="button button-small button-secondary"
              onClick={() => {
                onReview(selected)
                setSelected([])
              }}
            >
              <CheckCheck size={15} /> Review {selected.length}
            </button>
          )}
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all visible events"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected
                            ? selected.filter((id) => !filtered.some((e) => e.id === id))
                            : [...new Set([...selected, ...filtered.map((e) => e.id)])],
                        )
                      }
                    />
                  </th>
                  <th>Event</th>
                  <th>Camera</th>
                  <th>Time</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className={selected.includes(event.id) ? 'row-selected' : ''}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${event.id}`}
                        checked={selected.includes(event.id)}
                        onChange={() =>
                          setSelected(
                            selected.includes(event.id)
                              ? selected.filter((id) => id !== event.id)
                              : [...selected, event.id],
                          )
                        }
                      />
                    </td>
                    <td>
                      <button className="table-event-name" onClick={() => onEvent(event.id)}>
                        <span className={`event-icon event-icon-${event.type}`}>
                          <EventIcon type={event.type} />
                        </span>
                        <span>
                          <strong>{event.title}</strong>
                          <small>{event.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="table-primary">
                        {cameras.find((c) => c.id === event.cameraId)?.name ?? event.cameraId}
                      </span>
                      <small>{event.cameraId}</small>
                    </td>
                    <td>
                      <span className="table-primary">{event.time}</span>
                      <small>{timeAgo(event.minutesAgo)}</small>
                    </td>
                    <td>
                      <span className="confidence-value">{event.confidence}%</span>
                    </td>
                    <td>
                      {event.reviewed ? (
                        <Badge tone="green">
                          <Check size={11} /> Reviewed
                        </Badge>
                      ) : event.alert ? (
                        <Badge tone={event.severity === 'critical' ? 'red' : 'amber'} dot>
                          Needs review
                        </Badge>
                      ) : (
                        <Badge dot>Logged</Badge>
                      )}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View ${event.id}`}
                        onClick={() => onEvent(event.id)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching events"
            description="Try a different search or clear your filters."
            action={
              <button
                className="button button-secondary"
                onClick={() => {
                  setSearch('')
                  setType('all')
                  setCamera('all')
                  setFilter('all')
                }}
              >
                Clear filters
              </button>
            }
          />
        )}
        <div className="table-footer">
          <span>{filtered.length} events · Demo workspace</span>
          <span>Most recent first</span>
        </div>
      </section>
    </>
  )
}
