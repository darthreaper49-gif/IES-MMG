import { useState } from 'react'
import {
  Camera as CameraIcon,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { Camera } from '../types'
import { Badge, EmptyState, PageHeading, Select, Toggle } from '../components/ui'

export function CamerasPage({
  cameras,
  onAdd,
  onEdit,
  onExpand,
  onToggle,
}: {
  cameras: Camera[]
  onAdd: () => void
  onEdit: (id: string) => void
  onExpand: (id: string) => void
  onToggle: (id: string, online: boolean) => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const filtered = cameras.filter(
    (c) =>
      `${c.name} ${c.id} ${c.location}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === 'all' || (status === 'online' ? c.online : !c.online)),
  )
  return (
    <>
      <PageHeading title="Cameras" subtitle="Every camera. One connected workspace.">
        <button className="button button-primary" onClick={onAdd}>
          <Plus size={17} /> Add camera
        </button>
      </PageHeading>
      <div className="info-banner">
        <Wifi size={19} />
        <p>
          <strong>Your camera fleet, at a glance.</strong> This is a demo workspace. Camera
          connections and streaming will be configured when the backend is connected.
        </p>
      </div>
      <section className="panel">
        <div className="table-filters camera-management-filters">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search cameras..."
              aria-label="Search cameras"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <Select
            label="Filter camera status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'online', label: 'Online' },
              { value: 'offline', label: 'Paused' },
            ]}
          />
          <span className="filter-result-count">{filtered.length} cameras</span>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="data-table camera-table">
              <thead>
                <tr>
                  <th>Camera</th>
                  <th>Location</th>
                  <th>Stream quality</th>
                  <th>Status</th>
                  <th>Enabled</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((camera) => (
                  <tr key={camera.id}>
                    <td>
                      <button className="table-event-name" onClick={() => onExpand(camera.id)}>
                        <span className="camera-table-thumbnail">
                          <img src={camera.image} alt="" />
                        </span>
                        <span>
                          <strong>{camera.name}</strong>
                          <small>{camera.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="location-cell">
                        <MapPin size={14} />
                        {camera.location}
                      </span>
                    </td>
                    <td>
                      <span className="table-primary">
                        {camera.resolution} <span className="muted">/ {camera.fps} FPS</span>
                      </span>
                      <small>H.265 · Demo stream</small>
                    </td>
                    <td>
                      <Badge tone={camera.online ? 'green' : 'neutral'} dot>
                        {camera.online ? 'Online' : 'Paused'}
                      </Badge>
                    </td>
                    <td>
                      <Toggle
                        label={`Enable ${camera.name}`}
                        checked={camera.online}
                        onChange={(value) => onToggle(camera.id, value)}
                      />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${camera.name}`}
                          onClick={() => onEdit(camera.id)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Preview ${camera.name}`}
                          onClick={() => onExpand(camera.id)}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No cameras found"
            description="Try another search or add a new camera."
          />
        )}
        <div className="table-footer">
          <span>
            <CameraIcon size={14} /> {cameras.length} cameras in this workspace
          </span>
          <span>
            {cameras.filter((c) => c.online).length} online <WifiOff size={13} />{' '}
            {cameras.filter((c) => !c.online).length} paused
          </span>
        </div>
      </section>
    </>
  )
}
