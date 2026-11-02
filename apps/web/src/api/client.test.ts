import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, post, setCsrf } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  setCsrf('');
});

describe('typed API transport', () => {
  it('uses same-origin cookies and does not attach a CSRF token to reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"items":[]}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrf('synthetic-csrf');
    await expect(api('/cameras')).resolves.toEqual({ items: [] });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/cameras');
    expect(options.credentials).toBe('same-origin');
    expect(options.headers['X-CSRF-Token']).toBeUndefined();
  });
  it('attaches the in-memory CSRF token to mutations, never a URL parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrf('synthetic-csrf');
    await post('/cameras', { name: 'Synthetic test' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).not.toContain('synthetic-csrf');
    expect(options.headers['X-CSRF-Token']).toBe('synthetic-csrf');
    expect(JSON.parse(options.body)).toEqual({ name: 'Synthetic test' });
  });
  it('handles an empty logout response without parsing JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api('/auth/session', { method: 'DELETE' })).resolves.toBeUndefined();
  });
  it('preserves problem status and exposes a retryable transport failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"detail":"Refresh before saving."}', { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(post('/incidents')).rejects.toEqual(new ApiError(409, 'Refresh before saving.'));
    fetchMock.mockResolvedValue(new Response('<html>Unavailable</html>', { status: 502 }));
    await expect(api('/cameras')).rejects.toEqual(new ApiError(502, 'Unexpected server response.'));
  });
});
