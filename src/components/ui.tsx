import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  ArrowUpRight,
  Car,
  Check,
  ChevronDown,
  CircleAlert,
  DoorOpen,
  Package,
  PersonStanding,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { Camera, EventType } from '../types'

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? 'brand-small' : ''}`}>
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M6 9.5 16 27 26 9.5h-6L16 17l-4-7.5H6Z" fill="currentColor" />
          <path d="M3 9V4h5M24 4h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="5" r="2" fill="currentColor" />
        </svg>
      </span>
      {!small && (
        <span>
          vigil<span className="brand-period">.</span>
        </span>
      )}
    </div>
  )
}
export function EventIcon({ type, size = 17 }: { type: EventType; size?: number }) {
  const Icon = {
    person: PersonStanding,
    vehicle: Car,
    motion: Activity,
    zone: ScanLine,
    object: Package,
    access: DoorOpen,
  }[type]
  return <Icon size={size} strokeWidth={1.7} />
}
export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode
  tone?: string
  dot?: boolean
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="status-dot" />}
      {children}
    </span>
  )
}
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}
export function Select({
  value,
  onChange,
  options,
  label,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string
  className?: string
}) {
  return (
    <div className={`select-wrap ${className}`}>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </div>
  )
}
export function EmptyState({
  title = 'Nothing here just yet',
  description,
  action,
}: {
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <ScanLine size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="heading-eyebrow">YOUR SECURITY WORKSPACE</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  )
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  className = '',
  drawer = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  className?: string
  drawer?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const first =
        ref.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        ref.current?.querySelector<HTMLElement>('input, select, button')
      first?.focus()
    }, 50)
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
      }
      if (e.key === 'Tab') {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, a[href], [tabindex="0"]',
          ) ?? [],
        ).filter((el) => el.offsetParent !== null)
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', keyHandler)
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', keyHandler)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className={`modal-backdrop ${drawer ? 'drawer-backdrop' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        className={`modal ${drawer ? 'drawer' : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="modal-header">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function DetectionBox({ camera, visible = true }: { camera: Camera; visible?: boolean }) {
  if (!camera.detection || !visible || !camera.online) return null
  const d = camera.detection
  return (
    <div
      className={`detection-box ${d.type === 'Vehicle' ? 'vehicle-box' : ''}`}
      style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}
    >
      <span>
        {d.type} <b>{d.confidence}%</b>
      </span>
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}
export function FeedImage({
  camera,
  overlays = true,
  className = '',
}: {
  camera: Camera
  overlays?: boolean
  className?: string
}) {
  return (
    <div className={`feed-image ${className} ${!camera.online ? 'feed-offline' : ''}`}>
      <img
        src={camera.image}
        alt={`Sample surveillance view of ${camera.name.toLowerCase()}`}
        draggable={false}
      />
      <DetectionBox camera={camera} visible={overlays} />
      {!camera.online && (
        <div className="offline-message">
          <CircleAlert size={25} />
          <strong>Camera paused</strong>
          <span>Enable this camera to preview its feed</span>
        </div>
      )}
    </div>
  )
}
export function HealthCard() {
  return (
    <div className="health-card">
      <div className="health-icon">
        <ShieldCheck size={23} />
      </div>
      <div>
        <strong>A little extra peace of mind.</strong>
        <p>Your demo workspace is running smoothly.</p>
        <span>
          <Check size={12} /> All systems operational
        </span>
      </div>
      <ArrowUpRight size={16} className="health-arrow" />
    </div>
  )
}
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`vigil-demo-${key}`)
      return saved ? (JSON.parse(saved) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`vigil-demo-${key}`, JSON.stringify(state))
    } catch {
      /* The interface still works if storage is unavailable. */
    }
  }, [key, state])
  return [state, setState] as const
}
export async function downloadSnapshot(camera: Camera, overlays: boolean) {
  const image = new Image()
  image.src = camera.image
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Snapshot unavailable')
  ctx.drawImage(image, 0, 0)
  const scale = canvas.width / 1000
  if (camera.detection && overlays) {
    const d = camera.detection
    ctx.strokeStyle = '#82edb5'
    ctx.lineWidth = 2 * scale
    ctx.strokeRect(
      (d.x / 100) * canvas.width,
      (d.y / 100) * canvas.height,
      (d.w / 100) * canvas.width,
      (d.h / 100) * canvas.height,
    )
    ctx.font = `${13 * scale}px sans-serif`
    ctx.fillStyle = '#82edb5'
    ctx.fillText(
      `${d.type} ${d.confidence}% · SAMPLE`,
      (d.x / 100) * canvas.width,
      (d.y / 100) * canvas.height - 7 * scale,
    )
  }
  ctx.fillStyle = 'rgba(12, 25, 21, .8)'
  ctx.fillRect(0, canvas.height - 44 * scale, canvas.width, 44 * scale)
  ctx.fillStyle = '#fff'
  ctx.font = `${13 * scale}px sans-serif`
  ctx.fillText(
    `VIGIL · ${camera.name} · ${camera.id} · DEMO IMAGE · ${new Date().toLocaleString()}`,
    16 * scale,
    canvas.height - 17 * scale,
  )
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Snapshot unavailable')
  downloadBlob(blob, `vigil-${camera.id.toLowerCase()}-snapshot.png`)
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}
