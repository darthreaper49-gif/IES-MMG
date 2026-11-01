import { useState } from 'react'
import {
  ArrowRight,
  Camera as CameraIcon,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Film,
  Info,
  LockKeyhole,
  MapPin,
  Pause,
  Play,
  Plus,
  Radio,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
} from 'lucide-react'
import type {
  Camera,
  DetectionEvent,
  DetectionRule,
  Dialog,
  EventType,
  Page,
  Recording,
} from '../types'
import { eventLabels, locations, timeAgo } from '../data'
import { Badge, EmptyState, EventIcon, FeedImage, Modal, Select, Toggle } from './ui'
import { pageNames } from './Sidebar'

interface Props {
  defaultConfidence: number
  dialog: Dialog
  cameras: Camera[]
  events: DetectionEvent[]
  rules: DetectionRule[]
  onClose: () => void
  setDialog: (dialog: Dialog) => void
  navigate: (page: Page) => void
  onSaveCamera: (camera: Camera, isNew: boolean) => void
  onSnapshot: (camera: Camera, overlays: boolean) => void
  onReview: (ids: string[]) => void
  onSaveRule: (rule: DetectionRule, remove?: boolean) => void
  onSelectRecording: (cameraId: string, type: EventType) => void
  recordings: Recording[]
}
export function Dialogs(props: Props) {
  const { dialog, cameras, events, rules, onClose } = props
  if (!dialog) return null
  if (dialog.type === 'camera') {
    const camera = cameras.find((c) => c.id === dialog.id)
    return camera ? <CameraDialog key={camera.id} camera={camera} {...props} /> : null
  }
  if (dialog.type === 'event') {
    const event = events.find((e) => e.id === dialog.id)
    const camera = cameras.find((c) => c.id === event?.cameraId)
    return event && camera ? <EventDialog event={event} camera={camera} {...props} /> : null
  }
  if (dialog.type === 'add-camera' || dialog.type === 'edit-camera')
    return (
      <CameraForm
        key={dialog.type === 'edit-camera' ? dialog.id : 'new'}
        camera={dialog.type === 'edit-camera' ? cameras.find((c) => c.id === dialog.id) : undefined}
        cameras={cameras}
        onClose={onClose}
        onSave={props.onSaveCamera}
      />
    )
  if (dialog.type === 'rule')
    return (
      <RuleForm
        defaultConfidence={props.defaultConfidence}
        key={dialog.id ?? 'new'}
        rule={rules.find((r) => r.id === dialog.id)}
        cameras={cameras}
        onClose={onClose}
        onSave={props.onSaveRule}
      />
    )
  if (dialog.type === 'search') return <SearchDialog {...props} />
  if (dialog.type === 'help')
    return (
      <Modal
        title="A clearer view starts here."
        subtitle="Welcome to Vigil, your intelligent surveillance workspace."
        onClose={onClose}
        className="help-modal"
      >
        <div className="modal-body">
          <div className="help-welcome">
            <ShieldCheck size={31} />
            <div>
              <h3>Meet your security workspace.</h3>
              <p>
                Explore a working interface with sample camera imagery, detections, and recordings.
                No real cameras are connected.
              </p>
            </div>
          </div>
          <div className="help-links">
            {[
              {
                page: 'live' as Page,
                icon: Radio,
                title: 'Take a look around',
                text: 'Switch layouts, toggle AI overlays, and expand any camera.',
              },
              {
                page: 'events' as Page,
                icon: ScanLine,
                title: 'Review what matters',
                text: 'Filter detections, inspect an event, and mark alerts reviewed.',
              },
              {
                page: 'recordings' as Page,
                icon: Film,
                title: 'Revisit a moment',
                text: 'Try the simulated playback controls and save a snapshot.',
              },
              {
                page: 'rules' as Page,
                icon: Sparkles,
                title: 'Make it your own',
                text: 'Create detection rules and adjust your workspace settings.',
              },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  props.navigate(item.page)
                  onClose()
                }}
              >
                <item.icon size={21} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          <div className="inline-note">
            <LockKeyhole size={18} />
            <span>
              Next up: authentication, secure camera connections, real streaming, and backend
              storage. This preview is not a production monitoring system.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <span>
            <CircleHelp size={14} /> Tip: press ⌘ / Ctrl + K to search
          </span>
          <button className="button button-primary" onClick={onClose}>
            Got it <Check size={15} />
          </button>
        </div>
      </Modal>
    )
  return null
}

function CameraDialog({
  camera,
  events,
  onClose,
  onSnapshot,
  setDialog,
  onSelectRecording,
}: Props & { camera: Camera }) {
  const [overlays, setOverlays] = useState(true)
  const [paused, setPaused] = useState(false)
  const related = events.filter((e) => e.cameraId === camera.id).slice(0, 3)
  return (
    <Modal
      title={camera.name}
      subtitle={`${camera.id} · ${camera.location}`}
      onClose={onClose}
      className="camera-modal"
    >
      <div className="expanded-feed">
        <FeedImage camera={camera} overlays={overlays && !paused} />
        <div className="expanded-feed-top">
          <Badge tone={camera.online ? 'green' : 'neutral'} dot>
            {camera.online ? (paused ? 'Preview paused' : 'Demo live feed') : 'Camera paused'}
          </Badge>
          <span>
            {camera.resolution} · {camera.fps} FPS
          </span>
        </div>
        {paused && (
          <div className="expanded-pause">
            <Pause size={32} />
            <span>Preview paused</span>
          </div>
        )}
        <div className="expanded-feed-controls">
          <button
            className="button button-dark"
            disabled={!camera.online}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="button button-dark"
            disabled={!camera.online}
            onClick={() => onSnapshot(camera, overlays)}
          >
            <CameraIcon size={15} /> Snapshot
          </button>
          <label>
            AI overlays{' '}
            <Toggle checked={overlays} onChange={setOverlays} label="Expanded camera AI overlays" />
          </label>
        </div>
      </div>
      <div className="expanded-camera-info">
        <div>
          <span>
            <Wifi size={15} />
            {camera.online ? 'Demo connection healthy' : 'No stream connected'}
          </span>
          <span>
            <MapPin size={15} />
            {camera.location}
          </span>
          <span>
            <ShieldCheck size={15} />
            Sample imagery
          </span>
        </div>
        <div className="expanded-recent">
          <h3>Recent events on this camera</h3>
          {related.length ? (
            related.map((e) => (
              <button key={e.id} onClick={() => setDialog({ type: 'event', id: e.id })}>
                <span className={`event-icon event-icon-${e.type}`}>
                  <EventIcon type={e.type} />
                </span>
                <span>
                  <strong>{e.title}</strong>
                  <small>{timeAgo(e.minutesAgo)}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <p>No sample events for this camera yet.</p>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button
          className="text-button"
          onClick={() => setDialog({ type: 'edit-camera', id: camera.id })}
        >
          Camera settings <ChevronRight size={14} />
        </button>
        <button
          className="button button-primary"
          onClick={() => {
            onSelectRecording(camera.id, 'person')
            onClose()
          }}
        >
          <Film size={16} /> View recordings
        </button>
      </div>
    </Modal>
  )
}
function EventDialog({
  event,
  camera,
  onClose,
  onReview,
  onSelectRecording,
  onSnapshot,
}: Props & { event: DetectionEvent; camera: Camera }) {
  return (
    <Modal
      title="Event details"
      subtitle={`${event.id} · Sample detection`}
      onClose={onClose}
      drawer
    >
      <div className="drawer-body">
        <div className="event-detail-image">
          <FeedImage camera={camera} />
          <span className="event-image-caption">
            <CameraIcon size={12} /> Sample camera image
          </span>
        </div>
        <div className="event-detail-title">
          <span className={`event-icon event-icon-${event.type}`}>
            <EventIcon type={event.type} size={23} />
          </span>
          <div>
            <h3>{event.title}</h3>
            <span>{timeAgo(event.minutesAgo)}</span>
          </div>
          {event.reviewed ? (
            <Badge tone="green">
              <Check size={12} /> Reviewed
            </Badge>
          ) : event.alert ? (
            <Badge tone="amber">Needs review</Badge>
          ) : (
            <Badge>Logged</Badge>
          )}
        </div>
        <p className="event-description">{event.description}</p>
        <dl className="event-detail-meta">
          <div>
            <dt>
              <CameraIcon size={14} /> Camera
            </dt>
            <dd>{camera.name}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={14} /> Location
            </dt>
            <dd>{camera.location}</dd>
          </div>
          <div>
            <dt>
              <Clock3 size={14} /> Detected at
            </dt>
            <dd>{event.time} · Nov 1, 2026</dd>
          </div>
          <div>
            <dt>
              <ScanLine size={14} /> Detection type
            </dt>
            <dd>{eventLabels[event.type]}</dd>
          </div>
          <div>
            <dt>
              <Sparkles size={14} /> AI confidence
            </dt>
            <dd className="text-green">
              {event.confidence}%{' '}
              <span className="confidence-meter">
                <i style={{ width: `${event.confidence}%` }} />
              </span>
            </dd>
          </div>
          <div>
            <dt>
              <Info size={14} /> Priority
            </dt>
            <dd>
              <Badge
                tone={
                  event.severity === 'critical'
                    ? 'red'
                    : event.severity === 'warning'
                      ? 'amber'
                      : 'green'
                }
              >
                {event.severity === 'critical'
                  ? 'High'
                  : event.severity === 'warning'
                    ? 'Medium'
                    : 'Informational'}
              </Badge>
            </dd>
          </div>
        </dl>
        <div className="inline-note">
          <Info size={16} />
          <span>
            This is a sample event, not a real security alert. Confidence and detection data are
            illustrative.
          </span>
        </div>
      </div>
      <div className="drawer-footer">
        <button
          className="button button-secondary"
          onClick={() => {
            onSelectRecording(camera.id, event.type)
            onClose()
          }}
        >
          <Play size={15} /> View recording
        </button>
        <button
          className="button button-primary"
          disabled={event.reviewed}
          onClick={() => onReview([event.id])}
        >
          <CheckCheck size={16} />
          {event.reviewed ? 'Reviewed' : 'Mark as reviewed'}
        </button>
        <button className="text-button" onClick={() => onSnapshot(camera, true)}>
          <Download size={14} /> Save event snapshot
        </button>
      </div>
    </Modal>
  )
}
function CameraForm({
  camera,
  cameras,
  onClose,
  onSave,
}: {
  camera?: Camera
  cameras: Camera[]
  onClose: () => void
  onSave: (camera: Camera, isNew: boolean) => void
}) {
  const [name, setName] = useState(camera?.name ?? '')
  const [location, setLocation] = useState(camera?.location ?? 'Main building')
  const [resolution, setResolution] = useState(camera?.resolution ?? '1080p')
  const [online, setOnline] = useState(camera?.online ?? false)
  return (
    <Modal
      title={camera ? 'Camera settings' : 'Add a camera'}
      subtitle={
        camera ? `Manage ${camera.id}` : 'Give your next point of view a place in the workspace.'
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const nextNumber = Math.max(0, ...cameras.map((c) => Number(c.id.split('-')[1]) || 0)) + 1
          onSave(
            {
              id: camera?.id ?? `CAM-${String(nextNumber).padStart(2, '0')}`,
              name: name.trim(),
              location,
              image:
                camera?.image ??
                (location === 'Outdoors'
                  ? '/images/parking.jpg'
                  : location === 'Warehouse'
                    ? '/images/warehouse.jpg'
                    : '/images/entrance.jpg'),
              online,
              resolution,
              fps: resolution === '4K' ? 30 : 25,
              detection: camera?.detection,
            },
            !camera,
          )
        }}
      >
        <div className="modal-body">
          <label className="field-label">
            Camera name
            <input
              data-autofocus
              required
              maxLength={45}
              placeholder="e.g. North entrance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              pattern=".*\S.*"
            />
          </label>
          <div className="form-grid">
            <label className="field-label">
              Location
              <Select
                label="Camera location"
                value={location}
                onChange={setLocation}
                options={locations.map((l) => ({ value: l, label: l }))}
              />
            </label>
            <label className="field-label">
              Stream quality
              <Select
                label="Camera stream quality"
                value={resolution}
                onChange={setResolution}
                options={['1080p', '2K', '4K'].map((v) => ({ value: v, label: v }))}
              />
            </label>
          </div>
          {camera && (
            <div className="setting-toggle-row">
              <div>
                <strong>Camera enabled</strong>
                <p>Show this camera as online in the demo.</p>
              </div>
              <Toggle label="Camera enabled" checked={online} onChange={setOnline} />
            </div>
          )}
          <div className="connection-preview">
            <span>
              <LockKeyhole size={22} />
            </span>
            <div>
              <strong>Secure connection comes next.</strong>
              <p>
                {camera
                  ? 'These settings are saved locally. No camera connection is changed.'
                  : 'This adds a demo camera to your interface. RTSP / ONVIF configuration, credentials, and secure streaming will be connected in the backend phase.'}
              </p>
            </div>
          </div>
          <div className="inline-note">
            <Info size={16} />
            <span>No camera URLs, passwords, or credentials are collected in this preview.</span>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" type="submit">
            {camera ? <Check size={16} /> : <Plus size={16} />}
            {camera ? 'Save changes' : 'Add demo camera'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
function RuleForm({
  defaultConfidence,
  rule,
  cameras,
  onClose,
  onSave,
}: {
  defaultConfidence: number
  rule?: DetectionRule
  cameras: Camera[]
  onClose: () => void
  onSave: (rule: DetectionRule, remove?: boolean) => void
}) {
  const [name, setName] = useState(rule?.name ?? '')
  const [type, setType] = useState<EventType>(rule?.type ?? 'person')
  const [schedule, setSchedule] = useState<DetectionRule['schedule']>(rule?.schedule ?? 'Always')
  const [cameraIds, setCameraIds] = useState<string[]>(rule?.cameraIds ?? [])
  const [sensitivity, setSensitivity] = useState(rule?.sensitivity ?? defaultConfidence)
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <Modal
      title={rule ? 'Edit detection rule' : 'Create a detection rule'}
      subtitle="Decide what to watch for, and where."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!cameraIds.length) return
          onSave({
            id: rule?.id ?? `RULE-${Date.now()}`,
            name: name.trim(),
            type,
            cameraIds,
            schedule,
            sensitivity,
            enabled,
          })
        }}
      >
        <div className="modal-body">
          <label className="field-label">
            Rule name
            <input
              data-autofocus
              required
              maxLength={55}
              pattern=".*\S.*"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Entrance awareness"
            />
          </label>
          <div className="form-grid">
            <label className="field-label">
              Detect
              <Select
                label="Rule detection type"
                value={type}
                onChange={(v) => setType(v as EventType)}
                options={Object.entries(eventLabels).map(([value, label]) => ({ value, label }))}
              />
            </label>
            <label className="field-label">
              Schedule
              <Select
                label="Rule schedule"
                value={schedule}
                onChange={(v) => setSchedule(v as DetectionRule['schedule'])}
                options={['Always', 'Outside office hours', 'Custom schedule'].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </label>
          </div>
          {schedule === 'Custom schedule' && (
            <div className="inline-note">
              <Clock3 size={16} />
              <span>
                Custom schedule preview: weekdays, 18:00–08:00. Time-based execution will be
                configured with the backend.
              </span>
            </div>
          )}
          <div className="field-label">
            Apply to cameras <span className="field-hint">Select at least one</span>
            <div className="camera-checkbox-grid">
              {cameras.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={cameraIds.includes(c.id)}
                    onChange={() =>
                      setCameraIds(
                        cameraIds.includes(c.id)
                          ? cameraIds.filter((id) => id !== c.id)
                          : [...cameraIds, c.id],
                      )
                    }
                  />
                  <span>
                    {c.name}
                    <small>{c.id}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="range-label">
            <span>
              Detection sensitivity<strong>{sensitivity}%</strong>
            </span>
            <input
              type="range"
              min="50"
              max="99"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
            />
            <span className="range-extents">
              <span>Fewer, stronger matches</span>
              <span>More sensitive</span>
            </span>
          </label>
          <div className="setting-toggle-row">
            <div>
              <strong>Enable rule</strong>
              <p>Save this rule as active in the demo workspace.</p>
            </div>
            <Toggle label="Enable rule" checked={enabled} onChange={setEnabled} />
          </div>
          {confirmDelete && (
            <div className="delete-confirmation">
              <span>Delete this detection rule?</span>
              <button
                type="button"
                className="button button-danger button-small"
                onClick={() => rule && onSave(rule, true)}
              >
                Yes, delete
              </button>
              <button type="button" className="text-button" onClick={() => setConfirmDelete(false)}>
                Keep rule
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {rule ? (
            <button
              type="button"
              className="text-button text-red"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} /> Delete rule
            </button>
          ) : (
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button type="submit" className="button button-primary" disabled={!cameraIds.length}>
            <Check size={16} />
            {rule ? 'Save rule' : 'Create rule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
function SearchDialog({ cameras, events, onClose, setDialog, navigate }: Props) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase().trim()
  const matchedCameras = cameras
    .filter((c) => `${c.name} ${c.id} ${c.location}`.toLowerCase().includes(q))
    .slice(0, 4)
  const matchedEvents = events
    .filter((e) => `${e.title} ${e.id}`.toLowerCase().includes(q))
    .slice(0, 3)
  const matchedPages = (Object.entries(pageNames) as [Page, string][])
    .filter(([, name]) => name.toLowerCase().includes(q))
    .slice(0, q ? 5 : 3)
  return (
    <Modal title="Search your workspace" onClose={onClose} className="search-modal">
      <div className="global-search-input">
        <Search size={20} />
        <input
          data-autofocus
          placeholder="Search cameras, events, or pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search workspace"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="search-results">
        {matchedPages.length > 0 && (
          <>
            <h3>{q ? 'Pages' : 'Quick navigation'}</h3>
            {matchedPages.map(([page, name]) => (
              <button
                key={page}
                onClick={() => {
                  navigate(page)
                  onClose()
                }}
              >
                <span className="search-result-icon">
                  <ArrowRight size={17} />
                </span>
                <span>
                  {name}
                  <small>Workspace page</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </>
        )}
        {matchedCameras.length > 0 && (
          <>
            <h3>Cameras</h3>
            {matchedCameras.map((c) => (
              <button key={c.id} onClick={() => setDialog({ type: 'camera', id: c.id })}>
                <span className="search-thumbnail">
                  <img src={c.image} alt="" />
                </span>
                <span>
                  {c.name}
                  <small>
                    {c.id} · {c.location}
                  </small>
                </span>
                <Badge tone={c.online ? 'green' : 'neutral'} dot>
                  {c.online ? 'Online' : 'Paused'}
                </Badge>
              </button>
            ))}
          </>
        )}
        {q && matchedEvents.length > 0 && (
          <>
            <h3>Events</h3>
            {matchedEvents.map((e) => (
              <button key={e.id} onClick={() => setDialog({ type: 'event', id: e.id })}>
                <span className={`event-icon event-icon-${e.type}`}>
                  <EventIcon type={e.type} />
                </span>
                <span>
                  {e.title}
                  <small>
                    {e.id} · {timeAgo(e.minutesAgo)}
                  </small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </>
        )}
        {!matchedCameras.length && !matchedEvents.length && !matchedPages.length && (
          <EmptyState
            title="No matches found"
            description="Try a camera name, event type, or page."
          />
        )}
      </div>
      <div className="search-footer">
        <span>
          <Search size={13} /> Search this demo workspace
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </Modal>
  )
}
