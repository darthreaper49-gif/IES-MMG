import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page: Page, role = 'Security operator') {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(role) }).click();
  await expect(page.getByRole('heading', { name: 'Your campus, at a glance.' })).toBeVisible();
}

test('operator can inspect synthetic media, review, and explicitly confirm an incident', async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByText('Synthetic data only. No real cameras or footage are connected.').first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open camera: Main entrance', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Camera details' })).toBeVisible();
  await expect(
    page.getByText('This is a generated illustration, not a live camera feed.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: /^Events/ })
    .click();
  await page.getByRole('button', { name: 'Review event: Motion detected' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Review event' })).toBeVisible();
  await page
    .getByLabel('Review notes')
    .fill('Reviewed the synthetic fixture; no real footage is involved.');
  await page.getByRole('button', { name: 'Save review' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Human review saved' })).toBeVisible();
  await page
    .getByRole('button', { name: 'Review event: Person in monitored zone' })
    .first()
    .click();
  await page.getByRole('radio', { name: 'Confirm incident', exact: true }).check();
  await page.getByLabel('Incident title', { exact: true }).fill('Synthetic verification test');
  await page
    .getByLabel('Review notes')
    .fill('Explicit human confirmation of a synthetic test event.');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm incident', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Synthetic incident confirmed' }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: /^Incidents/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Synthetic verification test' })).toBeVisible();
  await expect(
    page.getByText('Explicit human confirmation of a synthetic test event.'),
  ).toBeVisible();
});

test('Spanish locale, filters, empty state, camera layouts and session logout work', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu centro, de un vistazo.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tu centro, de un vistazo.' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Compact view', exact: true }).click();
  await expect(page.locator('.camera-grid')).toHaveClass(/compact-grid/);
  await page.getByLabel('Search cameras, locations…').fill('does-not-exist');
  await expect(page.getByRole('heading', { name: 'No cameras found' })).toBeVisible();
  await page.getByLabel('Search cameras, locations…').fill('');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
});

test('viewer cannot review; administrator can register only a synthetic camera and read audit', async ({
  page,
}) => {
  await login(page, 'Viewer');
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: /^Events/ })
    .click();
  await page.getByRole('button', { name: 'Review event: Motion detected' }).first().click();
  await expect(page.getByText('Your role cannot perform this action.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save review' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: /Administrator Configuration/ }).click();
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: 'Administration' })
    .click();
  await page.getByRole('button', { name: 'Register synthetic camera' }).click();
  await page.getByLabel('Camera name', { exact: true }).fill('Browser test camera');
  await page.getByLabel('Location', { exact: true }).fill('Synthetic test location');
  await page.getByRole('button', { name: 'Register camera', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Synthetic camera registered' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Audit trail' }).click();
  await expect(page.getByText('camera.create', { exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: 'Cameras', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open camera: Browser test camera' }),
  ).toBeVisible();
});

test('mobile navigation and dashboard have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Security workspace' })
    .getByRole('button', { name: /^Events/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: Array.from(document.querySelectorAll('body *'))
      .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        width: element.getBoundingClientRect().width,
        right: element.getBoundingClientRect().right,
      }))
      .slice(0, 15),
  }));
  expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
});

test('login and operator overview pass automated WCAG A/AA checks', async ({ page }) => {
  await page.goto('/');
  const loginResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(loginResults.violations).toEqual([]);
  await login(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({ target: node.target, reason: node.failureSummary })),
    })),
  ).toEqual([]);
}

async function navigate(page: Page, name: string | RegExp) {
  await page.locator('#workspace-navigation').getByRole('button', { name }).click();
}

test('camera and event filters stay independent; incident details survive empty event filters', async ({
  page,
}) => {
  await login(page);
  const session = await (await page.request.get('/api/v1/auth/session')).json();
  const events = await (
    await page.request.get('/api/v1/events?category=person&review_status=pending')
  ).json();
  const confirmation = await page.request.post('/api/v1/incidents', {
    headers: { 'X-CSRF-Token': session.csrf_token },
    data: {
      event_id: events.items[0].id,
      event_version: events.items[0].version,
      title: 'Independent filter test incident',
      severity: 'high',
      rationale: 'Explicit synthetic fixture for testing incident navigation.',
    },
  });
  expect(confirmation.status()).toBe(201);
  await page.getByLabel('Group', { exact: true }).selectOption({ label: 'Outdoor' });
  await expect(page.locator('.camera-card')).toHaveCount(3);
  await navigate(page, /^Events/);
  await page.getByLabel('Camera', { exact: true }).selectOption({ label: 'Main entrance' });
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await navigate(page, 'Cameras');
  await expect(page.getByLabel('Group', { exact: true }).locator('option:checked')).toHaveText(
    'Outdoor',
  );
  await page.getByLabel('Group', { exact: true }).selectOption({ label: 'Indoor' });
  await expect(page.locator('.camera-card')).toHaveCount(2);
  await navigate(page, /^Incidents/);
  await page
    .locator('.incident-card')
    .filter({ hasText: 'Independent filter test incident' })
    .getByRole('button', { name: 'Event details' })
    .click();
  await expect(page.getByRole('dialog', { name: 'Review event' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Person in monitored zone' })).toBeVisible();
});

test('administrator edits synthetic configuration and disabled state is honest', async ({
  page,
}) => {
  await login(page, 'Administrator');
  const session = await (await page.request.get('/api/v1/auth/session')).json();
  const groups = await (await page.request.get('/api/v1/camera-groups')).json();
  const created = await page.request.post('/api/v1/cameras', {
    headers: { 'X-CSRF-Token': session.csrf_token },
    data: {
      name: 'Configuration test fixture',
      location: 'Synthetic configuration room',
      group_id: groups.items[0].id,
    },
  });
  expect(created.status()).toBe(201);
  await navigate(page, 'Cameras');
  await page
    .getByRole('button', { name: 'Open camera: Configuration test fixture', exact: true })
    .click();
  await page.getByLabel('Camera name', { exact: true }).fill('Synthetic entrance configured');
  await page.getByLabel('Camera enabled', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save configuration' }).click();
  await expect(page.getByRole('dialog').getByText('Disabled', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText('You do not have permission for this action.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open camera: Synthetic entrance configured' }),
  ).toBeVisible();
});

test('cursor pagination loads older events and removes overlap', async ({ page }) => {
  let firstPage: Record<string, unknown>[] = [];
  await page.route('**/api/v1/events?limit=50', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    firstPage = Array.from({ length: 50 }, (_, index) => ({
      ...body.items[0],
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    }));
    await route.fulfill({ json: { items: firstPage, next_cursor: 'synthetic-page-two' } });
  });
  await page.route('**/api/v1/events?**cursor=synthetic-page-two**', async (route) => {
    expect(new URL(route.request().url()).searchParams.get('cursor')).toBe('synthetic-page-two');
    await route.fulfill({
      json: {
        items: [firstPage[49], { ...firstPage[0], id: '10000000-0000-4000-8000-000000000000' }],
        next_cursor: null,
      },
    });
  });
  await login(page);
  await navigate(page, /^Events/);
  await expect(page.locator('tbody tr')).toHaveCount(50);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(51);
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
});

test('all operator views and review dialogs pass automated accessibility checks in English and Spanish', async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  await login(page);
  for (const locale of ['EN', 'ES']) {
    await page.getByRole('button', { name: locale, exact: true }).click();
    for (const name of ['Overview', 'Cameras', /^Events/, /^Incidents/]) {
      const spanish: Record<string, string> = { Overview: 'Resumen', Cameras: 'Cámaras' };
      await navigate(
        page,
        typeof name === 'string'
          ? locale === 'ES'
            ? spanish[name]
            : name
          : locale === 'ES'
            ? name.source.includes('Events')
              ? /^Eventos/
              : /^Incidencias/
            : name,
      );
      await expect(page.locator('.loading-state')).toHaveCount(0);
      await audit(page);
    }
  }
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await navigate(page, /^Events/);
  await page.getByRole('button', { name: 'Review event: Vehicle activity' }).click();
  await audit(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Cameras');
  await page.getByRole('button', { name: 'Open camera: Main entrance', exact: true }).click();
  await expect(
    page.getByText('This is a generated illustration, not a live camera feed.'),
  ).toBeVisible();
  await audit(page);
  await page.keyboard.press('Escape');
  await navigate(page, 'Overview');
  await page.screenshot({
    path: testInfo.outputPath('synthetic-overview-desktop.png'),
    fullPage: true,
  });
});

test('administrator tables and registration dialog pass automated accessibility checks', async ({
  page,
}) => {
  await login(page, 'Administrator');
  await navigate(page, 'Administration');
  await expect(page.getByRole('table')).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'Audit trail' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'Register synthetic camera' }).click();
  await audit(page);
});

test('small mobile layouts, keyboard navigation and Spanish login remain usable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await audit(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Operador de seguridad Supervisar/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu centro, de un vistazo.' })).toBeVisible();
  await audit(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await audit(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir navegación' })).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath('synthetic-overview-mobile.png'),
    fullPage: true,
  });
});

test('SSE failure falls back to polling and expired sessions clear protected data', async ({
  page,
}) => {
  await page.route('**/api/v1/system/event-updates', (route) => route.abort());
  await login(page);
  await expect(page.getByText('Periodic refresh', { exact: true })).toBeVisible();
  await expect(page.locator('.camera-card').first()).toBeVisible();
  await page.route('**/api/v1/events?**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/problem+json',
      body: JSON.stringify({ detail: 'Your session expired. Please sign in.' }),
    }),
  );
  await navigate(page, /^Events/);
  await page.getByLabel('Severity', { exact: true }).selectOption('high');
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open camera:/ })).toHaveCount(0);
});
