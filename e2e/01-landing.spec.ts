import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads with correct hero headline', async ({ page }) => {
    await expect(page).toHaveTitle(/Avasafe/)
    await expect(page.getByText('Government paperwork, handled.')).toBeVisible()
  })

  test('displays the how-it-works step cards', async ({ page }) => {
    await expect(page.getByText('Upload your documents')).toBeVisible()
    await expect(page.getByText('You submit in two steps')).toBeVisible()
  })

  test('shows trust signal bar', async ({ page }) => {
    await expect(page.getByText('End-to-end encrypted').first()).toBeVisible()
    await expect(page.getByText('No human sees your docs').first()).toBeVisible()
    await expect(page.getByText('Fix rejections free').first()).toBeVisible()
  })

  test('displays four pricing tiers with correct prices', async ({ page }) => {
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection.getByText('Free', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Locker', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Guided', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Human Assisted', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('$19')).toBeVisible()
    await expect(pricingSection.getByText('$29')).toBeVisible()
    await expect(pricingSection.getByText('$79')).toBeVisible()
  })

  test('pricing rejection guarantee note is shown', async ({ page }) => {
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection.getByText(/Rejection guarantee/)).toBeVisible()
  })

  test('shows FAQ section', async ({ page }) => {
    await expect(page.getByText('Common questions')).toBeVisible()
    await expect(page.getByText(/Is it safe to upload my passport/i)).toBeVisible()
  })

  test('Start for free CTA links to auth signup', async ({ page }) => {
    const cta = page.locator('a[href="/auth?mode=signup"]').first()
    await expect(cta).toBeVisible()
  })

  test('Sign in nav link is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('nav Sign in links to /auth', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Sign in' })
    await expect(link).toHaveAttribute('href', '/auth')
  })

  test('footer shows brand name', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText('Avasafe AI')
  })

  test('no 404 errors on page load', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})
