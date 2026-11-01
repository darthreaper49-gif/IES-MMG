import { Clock3, Pencil, Plus, ScanLine, ShieldCheck, Sparkles } from 'lucide-react'
import type { Camera, DetectionRule } from '../types'
import { eventLabels } from '../data'
import { Badge, EventIcon, PageHeading, Toggle } from '../components/ui'

export function RulesPage({
  rules,
  cameras,
  onEdit,
  onAdd,
  onToggle,
}: {
  rules: DetectionRule[]
  cameras: Camera[]
  onEdit: (id: string) => void
  onAdd: () => void
  onToggle: (id: string, enabled: boolean) => void
}) {
  return (
    <>
      <PageHeading
        title="Detection rules"
        subtitle="A more intelligent watch, tailored to your spaces."
      >
        <button className="button button-primary" onClick={onAdd}>
          <Plus size={17} /> Create rule
        </button>
      </PageHeading>
      <div className="rules-intro">
        <span className="rules-intro-icon">
          <Sparkles size={26} />
        </span>
        <div>
          <h2>Less noise. More knowing.</h2>
          <p>
            Choose what Vigil looks out for. Fine-tune your detection rules to keep the important
            things in focus.
          </p>
        </div>
        <Badge tone="green">
          <ShieldCheck size={13} /> {rules.filter((r) => r.enabled).length} rules active
        </Badge>
      </div>
      <div className="rules-list">
        {rules.map((rule) => (
          <section
            className={`panel rule-card ${!rule.enabled ? 'rule-disabled' : ''}`}
            key={rule.id}
          >
            <div className="rule-card-top">
              <span className={`event-icon event-icon-${rule.type}`}>
                <EventIcon type={rule.type} size={22} />
              </span>
              <div>
                <h3>{rule.name}</h3>
                <p>{eventLabels[rule.type]} detection</p>
              </div>
              <Toggle
                label={`Enable ${rule.name}`}
                checked={rule.enabled}
                onChange={(enabled) => onToggle(rule.id, enabled)}
              />
            </div>
            <div className="rule-details">
              <span>
                <ScanLine size={15} />
                {rule.cameraIds.length} cameras assigned
              </span>
              <span>
                <Clock3 size={15} />
                {rule.schedule}
              </span>
              <span>
                Sensitivity <strong>{rule.sensitivity}%</strong>
              </span>
            </div>
            <div className="rule-card-footer">
              <div className="camera-chips">
                {rule.cameraIds.slice(0, 3).map((id) => (
                  <span key={id}>{cameras.find((c) => c.id === id)?.name ?? id}</span>
                ))}
                {rule.cameraIds.length > 3 && <span>+{rule.cameraIds.length - 3} more</span>}
              </div>
              <button className="text-button" onClick={() => onEdit(rule.id)}>
                <Pencil size={14} /> Edit rule
              </button>
            </div>
          </section>
        ))}
      </div>
      <p className="page-footnote">
        <ShieldCheck size={14} /> Rules are saved locally for this interface preview. No live
        inference is running.
      </p>
    </>
  )
}
