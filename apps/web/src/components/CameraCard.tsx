import { formatTime } from '../format';
import { ArrowUpRight, MapPin, Video } from 'lucide-react';
import type { Camera } from '../api/client';
import { cameraNames, type Locale } from '../i18n';
import { SyntheticScene } from './SyntheticScene';
import { StatusBadge, type T } from './ui';
export function CameraCard({
  camera,
  open,
  t,
  locale,
  compact = false,
}: {
  camera: Camera;
  open: () => void;
  t: T;
  locale: Locale;
  compact?: boolean;
}) {
  const name = locale === 'es' ? cameraNames[camera.name] || camera.name : camera.name;
  const unavailable = !camera.enabled || ['offline', 'unknown'].includes(camera.status);
  return (
    <button
      className={`camera-card ${compact ? 'camera-compact' : ''}`}
      onClick={open}
      aria-label={`${t('openCamera')}: ${name}`}
    >
      <div className="camera-image">
        <SyntheticScene
          scene={camera.scene}
          unavailable={unavailable}
          label={t('syntheticFeed')}
          unavailableLabel={t('noFeed')}
        />
        <span className="camera-number">
          <Video size={12} />
          CAM {String(camera.scene + 1).padStart(2, '0')}
        </span>
        <StatusBadge status={!camera.enabled ? 'disabled' : camera.status} t={t} />
        <span className="camera-open">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="camera-card-info">
        <h3>{name}</h3>
        <p>
          <MapPin size={12} />
          {camera.location}
        </p>
        <div className="camera-meta">
          <span>{t('syntheticFeed')}</span>
          <time>{formatTime(camera.last_seen_at, locale)}</time>
        </div>
      </div>
    </button>
  );
}
