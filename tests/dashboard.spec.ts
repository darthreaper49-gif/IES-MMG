import { test, expect } from '@playwright/test'

test('overview renders real local assets and all four camera previews', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  await expect(page.getByText('Welcome back, Alex.', { exact: false })).toBeVisible()
  await expect(page.locator('.camera-card')).toHaveCount(4)
  await expect(page.locator('.detection-box')).toHaveCount(4)
  await expect(page.getByText('Demo feeds · sample imagery')).toBeVisible()
  expect(
    await page
      .locator('.camera-picture img')
      .evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true)
  expect(errors).toEqual([])
})

test('AI overlays, pagination, focus layout and expanded camera work', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('switch', { name: 'Show AI detection overlays' }).click()
  await expect(page.locator('.detection-box')).toHaveCount(0)
  await page.getByRole('switch', { name: 'Show AI detection overlays' }).click()
  await expect(page.locator('.detection-box')).toHaveCount(4)
  await page.getByRole('button', { name: 'Next cameras' }).click()
  await expect(page.getByRole('button', { name: 'Select Reception', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Focus layout' }).click()
  await expect(page.locator('.camera-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Expand Reception', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Reception', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('event drawer reviews an alert and persists it after reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('.activity-item').filter({ hasText: 'Restricted zone entry' }).click()
  await expect(page.getByRole('dialog').getByText('EVT-1046', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Mark as reviewed' }).click()
  await expect(page.getByRole('button', { name: 'Reviewed', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(page.locator('.nav-badge')).toHaveText('2')
  await page.reload()
  await expect(page.locator('.nav-badge')).toHaveText('2')
  await page.getByRole('button', { name: 'Events & alerts' }).click()
  await page.getByRole('button', { name: 'Needs review' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
})

test('event search, type filtering, bulk review and CSV export work', async ({ page }) => {
  await page.goto('/#events')
  await page.getByRole('textbox', { name: 'Search events' }).fill('parking')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.getByRole('textbox', { name: 'Search events' }).fill('')
  await page.getByRole('combobox', { name: 'Filter by detection type' }).selectOption('zone')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('checkbox', { name: 'Select all visible events' }).check()
  await page.getByRole('button', { name: 'Review 1', exact: true }).click()
  await expect(page.locator('tbody').getByText('Reviewed', { exact: true })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export events' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('vigil-demo-events.csv')
})

test('add camera creates an explicitly offline demo entry', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add camera', exact: true }).click()
  await page.getByRole('textbox', { name: 'Camera name' }).fill('North gate')
  await page
    .getByRole('combobox', { name: 'Camera location', exact: true })
    .selectOption('Outdoors')
  await page.getByRole('button', { name: 'Add demo camera' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cameras', exact: true }).click()
  await page.getByRole('textbox', { name: 'Search cameras' }).fill('North gate')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody').getByText('Paused', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Enable North gate' }).click()
  await expect(page.locator('tbody').getByText('Online', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit North gate' }).click()
  await page.getByRole('textbox', { name: 'Camera name' }).fill('North gate updated')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.locator('tbody')).toContainText('North gate updated')
})

test('camera snapshot produces a downloadable PNG', async ({ page }) => {
  await page.goto('/')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save snapshot of Main entrance' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('vigil-cam-01-snapshot.png')
  await expect(page.getByRole('status')).toContainText('Snapshot saved')
})

test('detection rule can be created, edited, paused and deleted', async ({ page }) => {
  await page.goto('/#rules')
  await page.getByRole('button', { name: 'Create rule' }).click()
  await page.getByRole('textbox', { name: 'Rule name' }).fill('Test entrance rule')
  await page.getByRole('checkbox', { name: 'Main entrance' }).check()
  await page.getByRole('dialog').getByRole('button', { name: 'Create rule', exact: true }).click()
  const card = page.locator('.rule-card').filter({ hasText: 'Test entrance rule' })
  await expect(card).toBeVisible()
  await card.getByRole('switch').click()
  await expect(card.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  await card.getByRole('button', { name: 'Edit rule' }).click()
  await page.getByRole('textbox', { name: 'Rule name' }).fill('Updated entrance rule')
  await page.getByRole('button', { name: 'Save rule', exact: true }).click()
  const updated = page.locator('.rule-card').filter({ hasText: 'Updated entrance rule' })
  await updated.getByRole('button', { name: 'Edit rule' }).click()
  await page.getByRole('button', { name: 'Delete rule' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByText('Updated entrance rule', { exact: true })).toHaveCount(0)
})

test('simulated recording playback supports play, pause, seeking and speed', async ({ page }) => {
  await page.goto('/#recordings')
  await page.getByRole('button', { name: 'Play demo recording' }).click()
  await expect(page.getByText('SIMULATED PLAYBACK', { exact: true })).toBeVisible()
  await expect
    .poll(async () =>
      Number(await page.getByRole('slider', { name: 'Recording playback position' }).inputValue()),
    )
    .toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Pause recording', exact: true }).click()
  const paused = await page
    .getByRole('slider', { name: 'Recording playback position' })
    .inputValue()
  await page.getByRole('button', { name: 'Forward 10 seconds' }).click()
  expect(
    Number(await page.getByRole('slider', { name: 'Recording playback position' }).inputValue()),
  ).toBeGreaterThanOrEqual(Number(paused) + 10)
  await page.getByRole('combobox', { name: 'Playback speed' }).selectOption('2')
  await page.getByRole('combobox', { name: 'Recording day' }).selectOption('yesterday')
  await expect(page.locator('.recording-card')).toHaveCount(2)
  await page.getByRole('textbox', { name: 'Search recordings' }).fill('not a recording')
  await expect(page.getByText('No recordings found')).toBeVisible()
})

test('analytics range and interval controls update the chart and export', async ({ page }) => {
  await page.goto('/#analytics')
  await expect(page.locator('.chart-bar-column')).toHaveCount(7)
  await page.getByRole('combobox', { name: 'Analytics period' }).selectOption('month')
  await expect(page.locator('.chart-bar-column')).toHaveCount(6)
  await expect(page.locator('.donut-chart strong')).toHaveText('2,486')
  await page.getByRole('button', { name: 'Hourly', exact: true }).click()
  await expect(page.locator('.chart-bar-column')).toHaveCount(12)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export report' }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('vigil-demo-analytics.csv')
})

test('workspace settings save locally and update navigation and greeting', async ({ page }) => {
  await page.goto('/#settings')
  await page.getByRole('textbox', { name: 'Workspace name' }).fill('Harbor workspace')
  await page.getByRole('textbox', { name: 'Your name' }).fill('Sam Rivera')
  await page.getByRole('button', { name: 'Save changes', exact: true }).first().click()
  await expect(page.getByRole('status')).toContainText('preferences saved')
  await page.getByRole('button', { name: 'Storage & retention' }).click()
  await page.getByRole('combobox', { name: 'Recording retention' }).selectOption('60')
  await page.getByRole('button', { name: 'Save changes', exact: true }).first().click()
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await expect(page.getByText('Welcome back, Sam.', { exact: false })).toBeVisible()
  await page.reload()
  await expect(page.locator('.workspace-switch')).toContainText('Harbor')
  await page.getByRole('button', { name: 'Recordings', exact: true }).click()
  await expect(
    page.getByText('Recording retention is set to 60 days', { exact: false }),
  ).toBeVisible()
})

test('command search opens a camera and notifications can all be reviewed', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Search workspace' }).fill('Warehouse A')
  await page.locator('.search-results').getByRole('button', { name: 'Warehouse A' }).click()
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Warehouse A', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Notifications, 3 alerts need review' }).click()
  await page.getByRole('button', { name: 'Mark all reviewed' }).click()
  await expect(page.getByText('You’re all caught up.')).toBeVisible()
  await expect(page.locator('.nav-badge')).toHaveCount(0)
})

test('mobile navigation, forms and all pages fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  for (const route of [
    'overview',
    'live',
    'events',
    'recordings',
    'analytics',
    'cameras',
    'rules',
    'settings',
  ]) {
    await page.goto('/#' + route)
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.locator('.sidebar')).toHaveClass(/sidebar-open/)
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-open/)
  await page.getByRole('button', { name: 'Add camera', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    await page
      .getByRole('dialog')
      .evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth),
  ).toBe(true)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
