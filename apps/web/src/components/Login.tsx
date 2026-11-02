import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';
import { signIn, type Session } from '../api/client';
import { type Locale, translations } from '../i18n';
import { SyntheticScene } from './SyntheticScene';
export function Login({
  locale,
  setLocale,
  success,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  success: (s: Session) => void;
}) {
  const t = (key: keyof typeof translations.en) => translations[locale][key];
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('Operator!2026');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(name = username, pass = password) {
    setBusy(true);
    setError('');
    try {
      success(await signIn(name, pass));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <a className="skip-link" href="#main-content">
        {t('skipContent')}
      </a>
      <section className="login-story">
        <a className="wordmark wordmark-light" href="/">
          IES<span>MMG</span>
          <i />
        </a>
        <div className="login-story-content">
          <span className="eyebrow">INTELLIGENT SECURITY WORKSPACE</span>
          <h1>{t('welcome')}</h1>
          <p>{t('loginSub')}</p>
          <div className="login-preview">
            <SyntheticScene scene={1} label={t('syntheticFeed')} unavailableLabel={t('noFeed')} />
            <span className="preview-live">
              <span />
              {t('simulation')}
            </span>
            <div className="preview-caption">
              <ShieldCheck size={17} />
              {t('humanFirst')}
            </div>
          </div>
          <div className="login-principles">
            <div>
              <LockKeyhole size={20} />
              <span>
                <strong>{t('privacyFirst')}</strong>
                <small>{t('privacyDetail')}</small>
              </span>
            </div>
            <div>
              <Fingerprint size={20} />
              <span>
                <strong>{t('humanFirst')}</strong>
                <small>{t('humanDetail')}</small>
              </span>
            </div>
          </div>
        </div>
        <small className="login-footer">{t('loginDisclaimer')}</small>
      </section>
      <main id="main-content" tabIndex={-1} className="login-form-side">
        <div className="locale-switch login-locale" role="group" aria-label={t('language')}>
          <button
            className={locale === 'en' ? 'active' : ''}
            aria-pressed={locale === 'en'}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            className={locale === 'es' ? 'active' : ''}
            aria-pressed={locale === 'es'}
            onClick={() => setLocale('es')}
          >
            ES
          </button>
        </div>
        <div className="login-form-wrap">
          <span className="section-kicker">IESMMG · {t('prototype')}</span>
          <h2>{t('login')}</h2>
          <p className="muted">{t('loginIntro')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label>
              {t('username')}
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={64}
              />
            </label>
            <label>
              {t('password')}
              <div className="password-input">
                <input
                  autoComplete="current-password"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={256}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? t('hidePassword') : t('showPassword')}
                  aria-pressed={show}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="btn btn-primary login-submit" disabled={busy}>
              {busy ? t('signingIn') : t('signIn')}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="demo-divider">
            <span>{t('demoAccounts')}</span>
          </div>
          <div className="demo-roles">
            {(['operator', 'viewer', 'admin'] as const).map((role) => (
              <button
                key={role}
                disabled={busy}
                onClick={() => {
                  const name = role;
                  const pass =
                    role === 'operator'
                      ? 'Operator!2026'
                      : role === 'viewer'
                        ? 'Viewer!2026'
                        : 'Admin!2026';
                  setUsername(name);
                  setPassword(pass);
                  void submit(name, pass);
                }}
              >
                <span className={`role-avatar role-${role}`}>
                  {role === 'operator' ? 'OP' : role === 'viewer' ? 'VW' : 'AD'}
                </span>
                <span>
                  <strong>
                    {t(
                      role === 'operator'
                        ? 'security_operator'
                        : role === 'admin'
                          ? 'administrator'
                          : 'viewer',
                    )}
                  </strong>
                  <small>
                    {t(
                      role === 'operator'
                        ? 'operatorDesc'
                        : role === 'viewer'
                          ? 'viewerDesc'
                          : 'adminDesc',
                    )}
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <p className="brand-disclaimer">{t('brandPending')}</p>
        </div>
      </main>
    </div>
  );
}
