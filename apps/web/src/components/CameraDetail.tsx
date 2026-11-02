import { formatTime } from '../format';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, RefreshCw } from 'lucide-react';
import { patch, post, type Camera, type StreamSession } from '../api/client';
import { cameraNames, type Locale } from '../i18n';
import { SyntheticScene } from './SyntheticScene';
import { Loading, Modal, StatusBadge, type T } from './ui';
export function CameraDetail({
  camera,
  close,
  t,
  locale,
  canManage,
  notify,
}: {
  camera: Camera;
  close: () => void;
  t: T;
  locale: Locale;
  canManage: boolean;
  notify: (s: string) => void;
}) {
  const query = useQuery({
    queryKey: ['stream', camera.id],
    queryFn: () => post<StreamSession>(`/cameras/${camera.id}/stream-sessions`),
    retry: false,
    staleTime: 4 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const client = useQueryClient();
  const [name, setName] = useState(camera.name);
  const [location, setLocation] = useState(camera.location);
  const [enabled, setEnabled] = useState(camera.enabled);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  async function saveConfiguration() {
    setBusy(true);
    setFormError('');
    try {
      await patch(`/cameras/${camera.id}`, { name, location, enabled, version: camera.version });
      await Promise.all([
        client.invalidateQueries({ queryKey: ['cameras'] }),
        client.invalidateQueries({ queryKey: ['summary'] }),
        client.invalidateQueries({ queryKey: ['audit'] }),
        client.invalidateQueries({ queryKey: ['stream', camera.id] }),
      ]);
      notify(t('configurationSaved'));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('error'));
    } finally {
      setBusy(false);
    }
  }
  const unavailable = query.data?.mode !== 'simulation';
  async function toggle() {
    try {
      await post(`/cameras/${camera.id}/connection-tests`);
      await client.invalidateQueries({ queryKey: ['cameras'] });
      notify(t('connectionChecked'));
    } catch (e) {
      notify(e instanceof Error ? e.message : t('error'));
    }
  }
  return (
    <Modal title={t('cameraDetails')} close={close} t={t} wide>
      <div className="camera-detail-title">
        <div>
          <h3>{locale === 'es' ? cameraNames[camera.name] || camera.name : camera.name}</h3>
          <p>{camera.location}</p>
        </div>
        <StatusBadge status={!camera.enabled ? 'disabled' : camera.status} t={t} />
      </div>
      <div className="detail-viewport">
        {query.isLoading ? (
          <Loading text={t('loading')} />
        ) : (
          <SyntheticScene
            scene={camera.scene}
            unavailable={unavailable}
            label={t('syntheticFeed')}
            unavailableLabel={t('noFeed')}
          />
        )}
      </div>
      <div className="info-callout">
        <Info size={18} />
        <p>
          {query.isError
            ? query.error.message
            : unavailable
              ? t('unavailableNotice')
              : t('streamNotice')}
        </p>
      </div>
      <div className="detail-grid">
        <div>
          <span>{t('source')}</span>
          <strong>{t('synthetic')}</strong>
        </div>
        <div>
          <span>{t('lastSeen')}</span>
          <strong>{formatTime(camera.last_seen_at, locale, true)}</strong>
        </div>
        <div>
          <span>{t('recording')}</span>
          <strong>{t('automaticRecording')}</strong>
        </div>
        <div>
          <span>{t('ai')}</span>
          <strong>{t('notApplicable')}</strong>
        </div>
      </div>
      {canManage && (
        <form
          className="configuration-form"
          onSubmit={(event) => {
            event.preventDefault();
            void saveConfiguration();
          }}
        >
          <h4>{t('configuration')}</h4>
          <label>
            {t('cameraName')}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t('location')}
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {t('cameraEnabled')}
          </label>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('saving') : t('saveConfiguration')}
          </button>
        </form>
      )}
      {canManage && (
        <button className="btn btn-secondary" onClick={() => void toggle()}>
          <RefreshCw size={16} />
          {t('testConnection')}
        </button>
      )}
    </Modal>
  );
}
