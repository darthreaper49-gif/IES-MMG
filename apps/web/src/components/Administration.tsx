import { formatTime } from '../format';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, ClipboardList, Plus, ShieldCheck, Users } from 'lucide-react';
import { get, post, type Audit, type Group, type Items, type User } from '../api/client';
import { groupNames, type Locale } from '../i18n';
import { EmptyState, ErrorState, Loading, Modal, type T } from './ui';
export function Administration({
  t,
  locale,
  groups,
  notify,
}: {
  t: T;
  locale: Locale;
  groups: Group[];
  notify: (s: string) => void;
}) {
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [register, setRegister] = useState(false);
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => get<Items<User>>('/admin/users'),
  });
  const audit = useQuery({
    queryKey: ['audit'],
    queryFn: () => get<Items<Audit>>('/admin/audit-events'),
    refetchInterval: 30000,
  });
  return (
    <section className="admin-section">
      <div className="admin-toolbar">
        <div className="segmented-tabs" role="group" aria-label={t('administration')}>
          <button
            className={tab === 'users' ? 'active' : ''}
            aria-pressed={tab === 'users'}
            onClick={() => setTab('users')}
          >
            <Users size={17} />
            {t('users')}
          </button>
          <button
            className={tab === 'audit' ? 'active' : ''}
            aria-pressed={tab === 'audit'}
            onClick={() => setTab('audit')}
          >
            <ClipboardList size={17} />
            {t('audit')}
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setRegister(true)}>
          <Plus size={17} />
          {t('addCamera')}
        </button>
      </div>
      <div className="panel">
        {tab === 'users' ? (
          users.isLoading ? (
            <Loading text={t('loading')} />
          ) : users.isError ? (
            <ErrorState t={t} retry={() => void users.refetch()} />
          ) : (
            <div className="table-scroll" tabIndex={0} role="region" aria-label={t('users')}>
              <table>
                <caption className="sr-only">{t('users')}</caption>
                <thead>
                  <tr>
                    <th>{t('account')}</th>
                    <th>{t('role')}</th>
                    <th>{t('access')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="account-cell">
                          <span className="avatar">
                            {user.display_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </span>
                          <span>
                            <strong>{user.display_name}</strong>
                            <small>@{user.username}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="role-label">
                          <ShieldCheck size={15} />
                          {t(user.role)}
                        </span>
                      </td>
                      <td>
                        {!user.active
                          ? t('disabled')
                          : user.camera_ids === null
                            ? t('metadataOnly')
                            : `${user.camera_ids.length} ${t('cameras').toLowerCase()}`}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${user.active ? 'online' : 'offline'}`}
                        >
                          <Check size={13} />
                          {t(user.active ? 'enabled' : 'disabled')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : audit.isLoading ? (
          <Loading text={t('loading')} />
        ) : audit.isError ? (
          <ErrorState t={t} retry={() => void audit.refetch()} />
        ) : !audit.data?.items.length ? (
          <EmptyState title={t('noAudit')} description={t('adminSub')} />
        ) : (
          <div className="table-scroll" tabIndex={0} role="region" aria-label={t('audit')}>
            <table>
              <caption className="sr-only">{t('audit')}</caption>
              <thead>
                <tr>
                  <th>{t('time')} · UTC</th>
                  <th>{t('action')}</th>
                  <th>{t('actor')}</th>
                  <th>{t('source')}</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="nowrap">{formatTime(entry.created_at, locale, true)}</td>
                    <td>
                      <strong className="audit-action">{entry.action}</strong>
                      <small className="table-subtext">{entry.detail}</small>
                    </td>
                    <td>
                      {users.data?.items.find((u) => u.id === entry.actor_id)?.display_name ||
                        entry.actor_id?.slice(0, 8) ||
                        '—'}
                    </td>
                    <td>
                      <span className="source-tag">{t('simulation')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {tab === 'audit' && <p className="admin-note">{t('recentRecords')}</p>}
      <p className="admin-note">
        <ShieldCheck size={16} />
        {t('simulationOnly')}
      </p>
      {register && (
        <RegisterCamera
          t={t}
          locale={locale}
          groups={groups}
          close={() => setRegister(false)}
          notify={notify}
        />
      )}
    </section>
  );
}
function RegisterCamera({
  t,
  locale,
  groups,
  close,
  notify,
}: {
  t: T;
  locale: Locale;
  groups: Group[];
  close: () => void;
  notify: (s: string) => void;
}) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [group, setGroup] = useState(groups[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await post('/cameras', { name, location, group_id: group, source_type: 'simulation' });
      await client.invalidateQueries({ queryKey: ['cameras'] });
      await client.invalidateQueries({ queryKey: ['summary'] });
      await client.invalidateQueries({ queryKey: ['audit'] });
      notify(t('cameraSaved'));
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('required'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={t('addCamera')} t={t} close={close}>
      <div className="info-callout">
        <Camera size={20} />
        <p>{t('simulationOnly')}</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label>
          {t('cameraName')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label>
          {t('location')}
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
        </label>
        <label>
          {t('group')}
          <select value={group} onChange={(e) => setGroup(e.target.value)} required>
            {groups.map((g) => (
              <option value={g.id} key={g.id}>
                {locale === 'es' ? groupNames[g.name] || g.name : g.name}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            {t('cancel')}
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('saving') : t('register')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
