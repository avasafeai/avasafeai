import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, TEST_EMAIL, TEST_PASSWORD } from './helpers'

let userId: string

test.describe('Apply flow', () => {
  test.beforeAll(async () => {
    userId = await createTestUser()
  })

  test.afterAll(async () => {
    await deleteTestUser(userId)
  })

  async function signIn(page: Parameters<typeof test>[1]) {
    await page.goto('/auth')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  }

  test('/apply shows service picker with OCI and passport renewal', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply')
    await expect(page.getByText('OCI Card (New Application)')).toBeVisible()
    await expect(page.getByText('OCI Card (Renewal)')).toBeVisible()
    await expect(page.getByText('Indian Passport Renewal')).toBeVisible()
  })

  test('/apply shows AVA message about pre-filled data', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply')
    await expect(page.getByText(/I already have most of what I need/i)).toBeVisible()
  })

  test('/apply shows fee information for first service', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply')
    // Each card shows a fee — use first() since $29 Avasafe appears on multiple cards
    await expect(page.getByText(/\$275/).first()).toBeVisible()
    await expect(page.getByText(/\$29 Avasafe/).first()).toBeVisible()
  })

  test('/apply/form loads multi-step form with heading', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    // Use heading role to be specific (avoids matching the pill button)
    await expect(page.getByRole('heading', { name: 'Personal details' })).toBeVisible()
  })

  test('/apply/form has Continue and Back buttons', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    await expect(page.getByRole('button', { name: 'Continue →' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  test('/apply/form Back button is disabled on step 1', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()
  })

  test('/apply/form progress pills are visible', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    // The step pills at top — use button role to target them
    await expect(page.getByRole('button', { name: /Personal details/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Passport details/ })).toBeVisible()
  })

  test('/apply/form Continue advances to next step heading', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    await page.getByRole('button', { name: 'Continue →' }).click()
    // Use heading role to be specific
    await expect(page.getByRole('heading', { name: 'Passport details' })).toBeVisible()
  })

  test('/apply/review loads review page', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/review')
    await expect(page.getByText('Review your application')).toBeVisible()
  })

  // NOTE: /apply/status redirects to /apply when no application exists (tables not yet set up).
  // This test verifies the redirect chain works without a 404 or 500.
  test('/apply/status redirects gracefully when no application exists', async ({ page }) => {
    await signIn(page)
    const res = await page.goto('/apply/status')
    // Should redirect somewhere (to /apply or /apply/status) — not 404 or 500
    expect(res?.status()).not.toBe(404)
    expect(res?.status()).not.toBe(500)
  })
})
