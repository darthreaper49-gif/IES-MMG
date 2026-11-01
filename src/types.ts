export type Page =
  'overview' | 'live' | 'events' | 'recordings' | 'analytics' | 'cameras' | 'rules' | 'settings'
export type EventType = 'person' | 'vehicle' | 'motion' | 'zone' | 'object' | 'access'
export type Severity = 'info' | 'warning' | 'critical'
export interface Camera {
  id: string
  name: string
  location: string
  image: string
  online: boolean
  resolution: string
  fps: number
  detection?: {
    type: 'Person' | 'Vehicle'
    confidence: number
    x: number
    y: number
    w: number
    h: number
  }
}
export interface DetectionEvent {
  id: string
  type: EventType
  title: string
  cameraId: string
  time: string
  minutesAgo: number
  confidence: number
  severity: Severity
  alert: boolean
  reviewed: boolean
  description: string
}
export interface Recording {
  id: string
  cameraId: string
  title: string
  time: string
  day: 'today' | 'yesterday' | 'earlier'
  duration: number
  size: string
  type: EventType
}
export interface DetectionRule {
  id: string
  name: string
  type: EventType
  cameraIds: string[]
  schedule: 'Always' | 'Outside office hours' | 'Custom schedule'
  enabled: boolean
  sensitivity: number
}
export interface Preferences {
  workspace: string
  name: string
  email: string
  timezone: string
  retention: string
  emailAlerts: boolean
  desktopAlerts: boolean
  weeklyReport: boolean
  confidence: number
}
export type Dialog =
  | { type: 'camera'; id: string }
  | { type: 'event'; id: string }
  | { type: 'add-camera' }
  | { type: 'edit-camera'; id: string }
  | { type: 'rule'; id?: string }
  | { type: 'search' }
  | { type: 'help' }
  | null
