import { useEffect, useState } from 'react'
import {
  Camera as CameraIcon,
  ChevronLeft,
  ChevronRight,
  Expand,
  Grid2X2,
  Maximize2,
  Pause,
  Play,
  Radio,
  Signal,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Camera } from '../types'
import { Badge, EmptyState, FeedImage, Select, Toggle } from './ui'

export function CameraCard({
  camera,
  overlays,
  selected,
  onSelect,
  onExpand,
  onSnapshot,
  large = false,
  timezone = 'Europe/London',
}: {
  camera: Camera
  overlays: boolean
  selected?: boolean
  onSelect: () => void
  onExpand: () => void
  onSnapshot: () => void
  large?: boolean
  timezone?: string
}) {
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    if (paused || !camera.online) return
    const interval = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [paused, camera.online])
  return (
    <article
      className={`camera-card ${selected ? 'camera-selected' : ''} ${large ? 'camera-large' : ''}`}
    >
      <div className="camera-picture">
        <button
          className="camera-image-button"
          onClick={onSelect}
          onDoubleClick={onExpand}
          aria-label={`Select ${camera.name}`}
          aria-pressed={selected}
        >
          <FeedImage camera={camera} overlays={overlays && !paused} />
          <span className="camera-shade" />
          <span className="camera-topline">
            <span className="camera-id">
              <VideoIndicator />
              {camera.id}
            </span>
            <span className={`live-pill ${!camera.online || paused ? 'is-paused' : ''}`}>
              <span />
              {!camera.online ? 'OFFLINE' : paused ? 'PAUSED' : 'DEMO LIVE'}
            </span>
          </span>
          {paused && camera.online && (
            <span className="feed-pause">
              <Pause size={24} fill="currentColor" />
            </span>
          )}
          <span className="camera-bottomline">
            <span>
              <strong>{camera.name}</strong>
              <small>{camera.location}</small>
            </span>
            <span className="feed-time">
              {time.toLocaleTimeString('en-GB', { timeZone: timezone })}
              <small>
                {camera.resolution} <span>·</span> {camera.fps} FPS
              </small>
            </span>
          </span>
        </button>
        <div className="camera-hover-tools">
          <button
            title={paused ? 'Resume demo preview' : 'Pause demo preview'}
            aria-label={`${paused ? 'Resume' : 'Pause'} ${camera.name}`}
            onClick={() => setPaused(!paused)}
            disabled={!camera.online}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button
            title={muted ? 'Enable audio (demo)' : 'Mute audio (demo)'}
            aria-label={`${muted ? 'Enable' : 'Mute'} audio for ${camera.name}`}
            onClick={() => setMuted(!muted)}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            title="Save snapshot"
            aria-label={`Save snapshot of ${camera.name}`}
            onClick={onSnapshot}
            disabled={!camera.online}
          >
            <CameraIcon size={15} />
          </button>
          <button title="Expand camera" aria-label={`Expand ${camera.name}`} onClick={onExpand}>
            <Maximize2 size={15} />
          </button>
        </div>
        {overlays && camera.detection && camera.online && !paused && (
          <span className="ai-feed-tag">
            <ScanCorners /> AI tracking
          </span>
        )}
      </div>
      <div className="camera-card-footer">
        <span>
          <span className={`status-dot ${camera.online ? '' : 'dot-gray'}`} />
          {camera.online ? 'Online' : 'Not connected'}
        </span>
        <span>
          <Signal size={12} /> {camera.online ? 'Excellent' : 'No signal'}
          <span className="camera-footer-divider" />
          <button onClick={onExpand} aria-label={`Open ${camera.name} details`}>
            <Expand size={13} />
          </button>
        </span>
      </div>
    </article>
  )
}
function VideoIndicator() {
  return <Radio size={12} strokeWidth={1.8} />
}
function ScanCorners() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 1H1v3m7-3h3v3M1 8v3h3m7-3v3H8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="4" y="4" width="4" height="4" stroke="currentColor" />
    </svg>
  )
}

export function CameraWall({
  cameras,
  onExpand,
  onSnapshot,
  onViewAll,
  full = false,
  onLocationChange,
  location = 'all',
  timezone = 'Europe/London',
}: {
  cameras: Camera[]
  onExpand: (id: string) => void
  onSnapshot: (camera: Camera, overlays: boolean) => void
  onViewAll?: () => void
  full?: boolean
  onLocationChange?: (location: string) => void
  location?: string
  timezone?: string
}) {
  const [overlays, setOverlays] = useState(true)
  const [layout, setLayout] = useState<'grid' | 'focus'>('grid')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(cameras[0]?.id)
  const pageSize = full ? 8 : 4
  const pages = Math.max(1, Math.ceil(cameras.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const visible =
    layout === 'focus'
      ? cameras.filter((c) => c.id === selected).length
        ? cameras.filter((c) => c.id === selected)
        : cameras.slice(0, 1)
      : cameras.slice(safePage * pageSize, (safePage + 1) * pageSize)
  const cameraKey = cameras.map((camera) => camera.id).join(',')
  useEffect(() => {
    setPage(0)
  }, [location, cameraKey])
  useEffect(() => {
    setSelected(cameraKey.split(',')[safePage * pageSize] ?? cameraKey.split(',')[0])
  }, [cameraKey, safePage, pageSize])
  return (
    <section className={`panel camera-wall ${full ? 'camera-wall-full' : ''}`}>
      <div className="panel-heading camera-wall-heading">
        <div className="panel-title">
          <h2>{full ? 'Camera wall' : 'Live cameras'}</h2>
          <Badge tone="green">{cameras.filter((c) => c.online).length} online</Badge>
        </div>
        <div className="camera-wall-actions">
          {onViewAll && (
            <button className="text-button view-all-button" onClick={onViewAll}>
              View all <ChevronRight size={14} />
            </button>
          )}
          {full && (
            <Select
              label="Camera location"
              value={location}
              onChange={(v) => onLocationChange?.(v)}
              options={[
                { value: 'all', label: 'All locations' },
                { value: 'Main building', label: 'Main building' },
                { value: 'Outdoors', label: 'Outdoors' },
                { value: 'Warehouse', label: 'Warehouse' },
              ]}
            />
          )}
          <div className="layout-switch">
            <button
              className={layout === 'grid' ? 'active' : ''}
              onClick={() => setLayout('grid')}
              aria-label="Grid layout"
              aria-pressed={layout === 'grid'}
            >
              <Grid2X2 size={15} />
            </button>
            <button
              className={layout === 'focus' ? 'active' : ''}
              onClick={() => setLayout('focus')}
              aria-label="Focus layout"
              aria-pressed={layout === 'focus'}
            >
              <Square size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="camera-wall-subhead">
        <span>
          <span className="status-dot" /> A clear view of what matters
        </span>
        <label className="overlay-control">
          <span>AI overlays</span>
          <Toggle checked={overlays} onChange={setOverlays} label="Show AI detection overlays" />
        </label>
      </div>
      {visible.length ? (
        <div className={`camera-grid ${layout === 'focus' ? 'focus-grid' : ''}`}>
          {visible.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              overlays={overlays}
              selected={selected === camera.id}
              onSelect={() => setSelected(camera.id)}
              onExpand={() => onExpand(camera.id)}
              onSnapshot={() => onSnapshot(camera, overlays)}
              large={layout === 'focus' || full}
              timezone={timezone}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No cameras in this location"
          description="Choose another location or add a camera to your workspace."
        />
      )}
      <div className="camera-wall-footer">
        <span>
          <span className="demo-dot" /> Demo feeds · sample imagery
        </span>
        {layout === 'grid' && pages > 1 ? (
          <div className="pagination">
            <span>
              {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, cameras.length)} of{' '}
              {cameras.length} cameras
            </span>
            <button
              className="icon-button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous cameras"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="icon-button"
              disabled={safePage === pages - 1}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next cameras"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <span>
            <ShieldSmall /> Ready for secure integration
          </span>
        )}
      </div>
    </section>
  )
}
function ShieldSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m8 1 5 2v5c0 3-5 6-5 6S3 11 3 8V3l5-2Z" stroke="currentColor" />
      <path d="m5.5 7.5 2 2 3-3" stroke="currentColor" />
    </svg>
  )
}
