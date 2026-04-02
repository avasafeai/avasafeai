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
    await expect(page.getByText('Upload your documents once')).toBeVisible()
    await expect(page.getByText("Two steps and you're done")).toBeVisible()
  })

  test('shows trust signal bar', async ({ page }) => {
    await expect(page.getByText('256-bit encrypted')).toBeVisible()
    await expect(page.getByText('No human access')).toBeVisible()
    await expect(page.getByText('Free fix guarantee')).toBeVisible()
  })

  test('displays three pricing tiers with correct prices', async ({ page }) => {
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection.getByText('Locker', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Locker + Apply', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Family', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('$19')).toBeVisible()
    await expect(pricingSection.getByText('$49')).toBeVisible()
    await expect(pricingSection.getByText('$99')).toBeVisible()
  })

  test('pricing rejection guarantee note is shown', async ({ page }) => {
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection.getByText(/Rejection guarantee included/)).toBeVisible()
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
