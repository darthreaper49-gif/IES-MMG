import { formatTime } from '../format';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, ShieldCheck } from 'lucide-react';
import { post, type SecurityEvent, type Camera } from '../api/client';
import { cameraNames, eventNames, zoneNames, type Locale } from '../i18n';
import { Modal, StatusBadge, type T } from './ui';
export function EventReview({
  event,
  camera,
  close,
  t,
  locale,
  canReview,
  saved,
}: {
  event: SecurityEvent;
  camera?: Camera;
  close: () => void;
  t: T;
  locale: Locale;
  canReview: boolean;
  saved: (message: string) => void;
}) {
  const [decision, setDecision] = useState<'false_positive' | 'needs_investigation' | 'confirmed'>(
    'needs_investigation',
  );
  const [rationale, setRationale] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alreadyReviewed = event.review_status === 'confirmed';
  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (decision === 'confirmed')
        await post('/incidents', {
          event_id: event.id,
          title,
          rationale,
          severity: event.severity,
          event_version: event.version,
        });
      else
        await post(`/events/${event.id}/reviews`, { decision, rationale, version: event.version });
      saved(t(decision === 'confirmed' ? 'incidentSaved' : 'reviewSaved'));
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={t('reviewEvent')} close={close} t={t}>
      <div className="review-event-heading">
        <span className="event-category-icon">
          <ShieldCheck size={22} />
        </span>
        <div>
          <h3>{locale === 'es' ? eventNames[event.kind] || event.kind : event.kind}</h3>
          <p>
            {camera
              ? locale === 'es'
                ? cameraNames[camera.name] || camera.name
                : camera.name
              : '—'}{' '}
            · {formatTime(event.observed_at, locale, true)}
          </p>
        </div>
        <StatusBadge status={event.severity} t={t} />
      </div>
      <div className="detail-grid">
        <div>
          <span>{t('zone')}</span>
          <strong>{locale === 'es' ? zoneNames[event.zone] || event.zone : event.zone}</strong>
        </div>
        <div>
          <span>{t('confidence')}</span>
          <strong>
            {event.confidence == null ? '—' : `${Math.round(event.confidence * 100)}%`}
          </strong>
        </div>
        <div>
          <span>{t('source')}</span>
          <strong>{t('eventSource')}</strong>
        </div>
        <div>
          <span>{t('status')}</span>
          <StatusBadge status={event.review_status} t={t} />
        </div>
      </div>
      <p className="score-note">{t('scoreNote')}</p>
      {event.review_status === 'false_positive' && <p className="muted">{t('dismissedNotice')}</p>}
      <div className="info-callout">
        <CircleHelp size={19} />
        <p>{t('reviewNotice')}</p>
      </div>
      {!canReview ? (
        <p className="muted">{t('noPermission')}</p>
      ) : alreadyReviewed ? (
        <div className="info-callout">
          <CheckCircle2 size={18} />
          <p>{t(event.review_status === 'confirmed' ? 'confirmed' : 'false_positive')}</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset className="decision-options">
            <legend>{t('decision')}</legend>
            {(
              [
                'false_positive',
                'needs_investigation',
                ...(event.review_status === 'false_positive' ? [] : (['confirmed'] as const)),
              ] as const
            ).map((value) => (
              <label key={value} className={decision === value ? 'selected' : ''}>
                <input
                  type="radio"
                  name="decision"
                  value={value}
                  checked={decision === value}
                  onChange={() => setDecision(value)}
                />
                {t(
                  value === 'false_positive'
                    ? 'markFalsePositive'
                    : value === 'confirmed'
                      ? 'confirmIncident'
                      : 'investigate',
                )}
              </label>
            ))}
          </fieldset>
          {decision === 'confirmed' && (
            <>
              <div className="warning-callout">
                <AlertTriangle size={19} />
                <p>{t('confirmNotice')}</p>
              </div>
              <label>
                {t('incidentTitle')}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('incidentTitlePlaceholder')}
                  minLength={4}
                  maxLength={160}
                  required
                />
              </label>
            </>
          )}
          <label>
            {t('rationale')}
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t('rationalePlaceholder')}
              minLength={8}
              maxLength={1000}
              rows={3}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={close}>
              {t('cancel')}
            </button>
            <button
              className={`btn ${decision === 'confirmed' ? 'btn-warning' : 'btn-primary'}`}
              disabled={busy}
            >
              {busy
                ? t('saving')
                : decision === 'confirmed'
                  ? t('confirmIncident')
                  : t('saveReview')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
