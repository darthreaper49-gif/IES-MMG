import { useState } from 'react'
import {
  Bell,
  Check,
  Database,
  LockKeyhole,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { Preferences } from '../types'
import { Badge, PageHeading, Select, Toggle } from '../components/ui'

export function SettingsPage({
  preferences,
  onSave,
}: {
  preferences: Preferences
  onSave: (p: Preferences) => void
}) {
  const [form, setForm] = useState(preferences)
  const [tab, setTab] = useState('general')
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setForm({ ...form, [key]: value })
  return (
    <>
      <PageHeading title="Settings" subtitle="Make this workspace work for you.">
        <button className="button button-primary" type="submit" form="settings-form">
          <Save size={16} /> Save changes
        </button>
      </PageHeading>
      <div className="settings-layout">
        <div className="settings-tabs">
          {[
            { id: 'general', name: 'General', icon: Settings2 },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'storage', name: 'Storage & retention', icon: Database },
            { id: 'security', name: 'Security', icon: LockKeyhole },
          ].map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={17} />
              {t.name}
            </button>
          ))}
        </div>
        <form
          id="settings-form"
          className="panel settings-form"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(form)
          }}
        >
          {tab === 'general' && (
            <>
              <div className="settings-section-heading">
                <UserRound size={21} />
                <div>
                  <h2>Workspace details</h2>
                  <p>A few details to make Vigil feel like yours.</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="field-label">
                  Workspace name
                  <input
                    required
                    maxLength={40}
                    value={form.workspace}
                    onChange={(e) => update('workspace', e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Your name
                  <input
                    required
                    maxLength={50}
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Email address
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Timezone
                  <Select
                    label="Workspace timezone"
                    value={form.timezone}
                    onChange={(v) => update('timezone', v)}
                    options={[
                      { value: 'Europe/London', label: 'London (GMT / BST)' },
                      { value: 'Atlantic/Canary', label: 'Canary Islands (WET / WEST)' },
                      { value: 'Europe/Madrid', label: 'Madrid (CET / CEST)' },
                      { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                      { value: 'America/New_York', label: 'New York (EST / EDT)' },
                    ]}
                  />
                </label>
              </div>
              <div className="settings-divider" />
              <div className="settings-section-heading">
                <ShieldCheck size={21} />
                <div>
                  <h2>Detection preferences</h2>
                  <p>Set the default confidence threshold for new detection rules.</p>
                </div>
              </div>
              <label className="range-label">
                <span>
                  Minimum confidence <strong>{form.confidence}%</strong>
                </span>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={form.confidence}
                  onChange={(e) => update('confidence', Number(e.target.value))}
                />
                <span className="range-extents">
                  <span>More detections</span>
                  <span>Higher precision</span>
                </span>
              </label>
            </>
          )}
          {tab === 'notifications' && (
            <>
              <div className="settings-section-heading">
                <Bell size={21} />
                <div>
                  <h2>Stay in the loop</h2>
                  <p>Choose how you would like to hear from Vigil.</p>
                </div>
              </div>
              {(
                [
                  {
                    key: 'emailAlerts',
                    title: 'Email alerts',
                    description:
                      'Receive an email when a high-priority detection needs your attention.',
                  },
                  {
                    key: 'desktopAlerts',
                    title: 'Desktop notifications',
                    description: 'Show a notification when a new alert arrives.',
                  },
                  {
                    key: 'weeklyReport',
                    title: 'Weekly workspace summary',
                    description:
                      'A weekly roundup of activity, camera health, and detection trends.',
                  },
                ] as const
              ).map((item) => (
                <div className="setting-toggle-row" key={item.key}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <Toggle
                    label={item.title}
                    checked={form[item.key]}
                    onChange={(v) => update(item.key, v)}
                  />
                </div>
              ))}
              <div className="inline-note">
                <Bell size={16} />
                <span>
                  Preferences are saved for this demo. Email and desktop delivery will be wired to
                  the backend later.
                </span>
              </div>
            </>
          )}
          {tab === 'storage' && (
            <>
              <div className="settings-section-heading">
                <Database size={21} />
                <div>
                  <h2>Recording storage</h2>
                  <p>Plan how long your workspace keeps recordings.</p>
                </div>
              </div>
              <div className="storage-overview">
                <div>
                  <strong>
                    1.24 TB <span>of 2 TB</span>
                  </strong>
                  <Badge tone="green">Healthy</Badge>
                </div>
                <div className="storage-progress">
                  <span />
                </div>
                <p>62% used · Sample storage data</p>
              </div>
              <label className="field-label">
                Recording retention
                <Select
                  label="Recording retention"
                  value={form.retention}
                  onChange={(v) => update('retention', v)}
                  options={[
                    { value: '7', label: '7 days' },
                    { value: '14', label: '14 days' },
                    { value: '30', label: '30 days (recommended)' },
                    { value: '60', label: '60 days' },
                    { value: '90', label: '90 days' },
                  ]}
                />
                <small>Older recordings would be automatically removed after this period.</small>
              </label>
              <div className="inline-note">
                <Database size={17} />
                <span>
                  No footage is stored by this interface. Storage policies will take effect after
                  secure backend wiring.
                </span>
              </div>
            </>
          )}
          {tab === 'security' && (
            <>
              <div className="settings-section-heading">
                <LockKeyhole size={21} />
                <div>
                  <h2>Security, by design</h2>
                  <p>A clear picture of what this preview does—and doesn’t—do.</p>
                </div>
              </div>
              <div className="security-checklist">
                {[
                  'No live cameras are connected',
                  'All imagery and detections are demo content',
                  'Preferences are stored only in this browser',
                  'No credentials or camera URLs are collected',
                  'Authentication and role-based access are planned for the backend',
                  'Secure streaming and encrypted storage are planned for the backend',
                ].map((item) => (
                  <div key={item}>
                    <Check size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="inline-note">
                <ShieldCheck size={18} />
                <span>
                  This interface is not a production security system. Do not rely on it for
                  real-time monitoring or alerting.
                </span>
              </div>
            </>
          )}
          <div className="settings-form-footer">
            <span>Changes apply to this demo workspace only.</span>
            <button className="button button-primary" type="submit">
              <Save size={15} /> Save changes
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
