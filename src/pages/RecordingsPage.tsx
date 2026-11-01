import { useEffect, useRef, useState } from 'react'
import {
  Camera as CameraIcon,
  Clock3,
  Expand,
  Film,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  VolumeX,
} from 'lucide-react'
import type { Camera, Recording } from '../types'
import { formatDuration } from '../data'
import { Badge, EmptyState, EventIcon, PageHeading, Select } from '../components/ui'

export function RecordingsPage({
  retention = '30',
  recordings,
  cameras,
  selectedId,
  onSelect,
  onSnapshot,
  onExpand,
}: {
  retention?: string
  recordings: Recording[]
  cameras: Camera[]
  selectedId: string
  onSelect: (id: string) => void
  onSnapshot: (camera: Camera, overlays: boolean) => void
  onExpand: (id: string) => void
}) {
  const recording = recordings.find((r) => r.id === selectedId) ?? recordings[0]
  const camera = cameras.find((c) => c.id === recording.cameraId) ?? cameras[0]
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('1')
  const [search, setSearch] = useState('')
  const [day, setDay] = useState('all')
  const [cameraFilter, setCameraFilter] = useState('all')
  const playerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setProgress(0)
    setPlaying(false)
  }, [recording.id])
  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(
      () => setProgress((p) => Math.min(recording.duration, p + 0.25 * Number(speed))),
      250,
    )
    return () => window.clearInterval(interval)
  }, [playing, speed, recording.duration])
  useEffect(() => {
    if (progress >= recording.duration) setPlaying(false)
  }, [progress, recording.duration])
  const filtered = recordings.filter(
    (r) =>
      (day === 'all' || r.day === day) &&
      (cameraFilter === 'all' || r.cameraId === cameraFilter) &&
      `${r.title} ${cameras.find((c) => c.id === r.cameraId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const play = () => {
    if (progress >= recording.duration) setProgress(0)
    setPlaying(!playing)
  }
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await playerRef.current?.requestFullscreen()
    } catch {
      onExpand(camera.id)
    }
  }
  return (
    <>
      <PageHeading title="Recordings" subtitle="Go back to the moments you don’t want to miss.">
        <Badge tone="amber">
          <Film size={14} /> Simulated playback
        </Badge>
      </PageHeading>
      <div className="recordings-layout">
        <section className="panel playback-panel">
          <div className="panel-heading">
            <div className="panel-title">
              <h2>{recording.title}</h2>
            </div>
            <Badge>{camera.id}</Badge>
          </div>
          <div className="playback-player" ref={playerRef}>
            <img src={camera.image} alt={`Demo recording preview from ${camera.name}`} />
            <div className="playback-top">
              <span>
                <span className={`status-dot ${playing ? '' : 'dot-gray'}`} />
                {playing ? 'SIMULATED PLAYBACK' : 'DEMO RECORDING'}
              </span>
              <span>{camera.name}</span>
            </div>
            {!playing && (
              <button className="big-play-button" onClick={play} aria-label="Play demo recording">
                <Play size={29} fill="currentColor" />
              </button>
            )}
            <div className="playback-overlay-bottom">
              <span>
                {recording.day === 'today'
                  ? 'Nov 1, 2026'
                  : recording.day === 'yesterday'
                    ? 'Oct 31, 2026'
                    : 'Oct 30, 2026'}{' '}
                · {recording.time}
              </span>
              <span>
                {formatDuration(progress)} / {formatDuration(recording.duration)}
              </span>
            </div>
          </div>
          <div className="playback-controls">
            <input
              className="playback-range"
              type="range"
              min="0"
              max={recording.duration}
              step="0.25"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              aria-label="Recording playback position"
              style={
                { '--progress': `${(progress / recording.duration) * 100}%` } as React.CSSProperties
              }
            />
            <div className="playback-controls-row">
              <div>
                <button
                  className="icon-button"
                  aria-label="Back 10 seconds"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  <SkipBack size={17} />
                </button>
                <button
                  className="playback-play"
                  aria-label={playing ? 'Pause recording' : 'Play recording'}
                  onClick={play}
                >
                  {playing ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="Forward 10 seconds"
                  onClick={() => setProgress(Math.min(recording.duration, progress + 10))}
                >
                  <SkipForward size={17} />
                </button>
                <span className="playback-time">
                  {formatDuration(progress)} <span>/ {formatDuration(recording.duration)}</span>
                </span>
              </div>
              <div>
                <Select
                  label="Playback speed"
                  value={speed}
                  onChange={setSpeed}
                  options={['0.5', '1', '1.5', '2'].map((v) => ({ value: v, label: `${v}×` }))}
                />
                <button
                  className="icon-button"
                  aria-label="Audio unavailable in demo"
                  title="Audio is not connected in this demo"
                  onClick={() => onExpand(camera.id)}
                >
                  <VolumeX size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Save recording snapshot"
                  onClick={() => onSnapshot(camera, false)}
                >
                  <CameraIcon size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Fullscreen playback"
                  onClick={fullscreen}
                >
                  <Expand size={17} />
                </button>
              </div>
            </div>
          </div>
          <div className="playback-notice">
            <Film size={15} />
            <span>
              Interface preview: playback controls animate a sample still. No video footage is
              stored or streamed.
            </span>
          </div>
        </section>
        <section className="panel recording-detail">
          <h2>Recording details</h2>
          <dl>
            <div>
              <dt>Camera</dt>
              <dd>{camera.name}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{camera.location}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(recording.duration)}</dd>
            </div>
            <div>
              <dt>Sample file size</dt>
              <dd>{recording.size}</dd>
            </div>
            <div>
              <dt>Quality</dt>
              <dd>
                {camera.resolution} · {camera.fps} FPS
              </dd>
            </div>
            <div>
              <dt>Trigger</dt>
              <dd>
                <EventIcon type={recording.type} size={14} /> AI detection
              </dd>
            </div>
          </dl>
          <div className="recording-detail-note">
            <Clock3 size={18} />
            <strong>Keep the important moments.</strong>
            <p>Recording retention is set to {retention} days in this demo workspace.</p>
          </div>
          <button className="button button-secondary" onClick={() => onSnapshot(camera, false)}>
            <CameraIcon size={16} /> Save snapshot
          </button>
        </section>
        <section className="panel recording-library">
          <div className="panel-heading">
            <div className="panel-title">
              <h2>Recording library</h2>
              <Badge>{recordings.length}</Badge>
            </div>
          </div>
          <div className="table-filters">
            <label className="search-field">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recordings..."
                aria-label="Search recordings"
              />
            </label>
            <Select
              label="Recording day"
              value={day}
              onChange={setDay}
              options={[
                { value: 'all', label: 'All dates' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'earlier', label: 'Earlier this week' },
              ]}
            />
            <Select
              label="Recording camera"
              value={cameraFilter}
              onChange={setCameraFilter}
              options={[
                { value: 'all', label: 'All cameras' },
                ...cameras.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="recording-grid">
            {filtered.map((r) => {
              const c = cameras.find((c) => c.id === r.cameraId) ?? cameras[0]
              return (
                <button
                  key={r.id}
                  className={`recording-card ${r.id === recording.id ? 'recording-selected' : ''}`}
                  onClick={() => onSelect(r.id)}
                >
                  <div className="recording-thumbnail">
                    <img src={c.image} alt="" />
                    <span className="recording-play">
                      <Play size={18} fill="currentColor" />
                    </span>
                    <span className="recording-duration">{formatDuration(r.duration)}</span>
                    {r.id === recording.id && <span className="recording-now">Selected</span>}
                  </div>
                  <div className="recording-card-info">
                    <strong>{r.title}</strong>
                    <span>
                      {c.name}
                      <span>·</span>
                      {r.day === 'today' ? 'Today' : r.day === 'yesterday' ? 'Yesterday' : 'Oct 30'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {!filtered.length && (
            <EmptyState
              title="No recordings found"
              description="Try a different camera, date, or search."
            />
          )}
          <div className="table-footer">
            <span>{filtered.length} sample recordings</span>
            <span>Sample footage only</span>
          </div>
        </section>
      </div>
    </>
  )
}
