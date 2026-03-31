import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads with correct hero headline', async ({ page }) => {
    await expect(page).toHaveTitle(/Avasafe AI/)
    await expect(page.getByText('Your OCI card.')).toBeVisible()
    await expect(page.getByText('Done in minutes, not weeks.')).toBeVisible()
  })

  test('displays the two-step promise cards in hero', async ({ page }) => {
    // Use exact match on the card heading text (not the FAQ paragraph)
    await expect(
      page.getByText('Pay the government fee', { exact: true }).first()
    ).toBeVisible()
    await expect(
      page.getByText('Drop envelope at UPS', { exact: true })
    ).toBeVisible()
  })

  test('shows trust signal bar', async ({ page }) => {
    // Scope to the trust signal section (after hero) by using the section
    const trustSection = page.locator('section').filter({ hasText: 'Bank-level encryption' }).first()
    await expect(trustSection.getByText('Bank-level encryption')).toBeVisible()
    await expect(trustSection.getByText('No human sees your documents')).toBeVisible()
    await expect(trustSection.getByText('Rejection guarantee')).toBeVisible()
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

  test('shows competitor positioning', async ({ page }) => {
    await expect(page.getByText(/Documitra is the travel agent/i)).toBeVisible()
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

  test('how it works section has 3 steps', async ({ page }) => {
    await expect(page.getByText('Upload your documents')).toBeVisible()
    await expect(page.getByText('AVA prepares everything')).toBeVisible()
    await expect(page.getByText("Two steps. You're done.")).toBeVisible()
  })

  test('footer shows tagline', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText('Your documents, safe.')
  })

  test('no 404 errors on page load', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})
