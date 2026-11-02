import type { components } from './schema';
export type Camera = components['schemas']['CameraOut'];
export type SecurityEvent = components['schemas']['EventOut'];
export type Incident = components['schemas']['IncidentOut'];
export type User = components['schemas']['UserOut'];
export type Group = components['schemas']['GroupOut'];
export type Audit = components['schemas']['AuditOut'];
export type Session = components['schemas']['SessionOut'];
export type Summary = components['schemas']['SummaryOut'];
export type Health = components['schemas']['SystemHealthOut'];
export type StreamSession = components['schemas']['StreamOut'];
export type Items<T> = { items: T[] };
export type EventPage = components['schemas']['EventPage'];
let csrfToken = '';
export function setCsrf(token: string) {
  csrfToken = token;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({ detail: 'Unexpected server response.' }));
  if (!response.ok) throw new ApiError(response.status, body.detail || 'Request failed.');
  return body as T;
}
export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export async function signIn(username: string, password: string) {
  const challenge = await get<{ csrf_token: string }>('/auth/csrf');
  setCsrf(challenge.csrf_token);
  const session = await post<Session>('/auth/session', { username, password });
  setCsrf(session.csrf_token);
  return session;
}

export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
