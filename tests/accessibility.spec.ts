import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('all workspace pages pass automated WCAG A/AA checks', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
    await page.goto(`/#${route}`)
    await expect(page.locator('h1')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations, `Accessibility violations on ${route}`).toEqual([])
  }
})

test('camera, event, search and rule dialogs pass automated accessibility checks', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const cases = [
    { route: 'overview', selector: '.page-actions > .button-primary' },
    { route: 'overview', selector: '.activity-item:has-text("Restricted zone entry")' },
    { route: 'overview', selector: '.global-search-button' },
    { route: 'rules', selector: '.page-actions > .button-primary' },
  ]
  for (const { route, selector } of cases) {
    await page.goto(`/#${route}`)
    await page.locator(selector).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations, `Accessibility violations in dialog on ${route}`).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
})
