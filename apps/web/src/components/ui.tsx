import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, Info, Circle, LoaderCircle, Radio, X, type LucideIcon } from 'lucide-react';
import { type TranslationKey } from '../i18n';
export type T = (key: TranslationKey) => string;
export function StatusBadge({ status, t }: { status: string; t: T }) {
  const known = [
    'online',
    'degraded',
    'offline',
    'unknown',
    'disabled',
    'pending',
    'confirmed',
    'false_positive',
    'needs_investigation',
    'high',
    'medium',
    'low',
    'critical',
  ];
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {known.includes(status) ? t(status as TranslationKey) : status}
    </span>
  );
}
export function EmptyState({
  icon: Icon = Radio,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading({ text }: { text: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={23} />
      <span>{text}</span>
    </div>
  );
}
export function ErrorState({ t, retry, message }: { t: T; retry: () => void; message?: string }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={25} />
      <h3>{t('error')}</h3>
      <p>{message || t('errorSub')}</p>
      <button className="btn btn-secondary" onClick={retry}>
        {t('retry')}
      </button>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
  t,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  t: T;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={close} aria-label={t('close')}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Toast({ message, close, t }: { message: string; close: () => void; t: T }) {
  useEffect(() => {
    const timer = setTimeout(close, 4500);
    return () => clearTimeout(timer);
  }, [message, close]);
  return (
    <div className="toast" role="status">
      <Info size={18} />
      <span>{message}</span>
      <button onClick={close} aria-label={t('dismiss')}>
        <X size={16} />
      </button>
    </div>
  );
}
export function SimulationNotice({ t }: { t: T }) {
  return (
    <div className="simulation-notice">
      <Circle size={8} fill="currentColor" />
      <span>{t('demoNotice')}</span>
    </div>
  );
}
