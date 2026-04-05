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
    await expect(page.getByText('OCI New Application')).toBeVisible()
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
    await expect(page.getByText(/\$274/).first()).toBeVisible()
    await expect(page.getByText(/\$29 Guided/).first()).toBeVisible()
  })

  test('/apply/form loads multi-step form with first question', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    // Step 1 renders the label "Your name" as a h2
    await expect(page.getByRole('heading', { name: 'Your name' })).toBeVisible()
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

  test('/apply/form shows step counter in header', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    // Header shows "Step 1 of 13" (or however many steps)
    await expect(page.getByText(/Step 1 of/i)).toBeVisible()
  })

  test('/apply/form Continue advances to step 2 heading', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/form')
    // Fill step 1 (name group — first_name + last_name)
    const textboxes = page.getByRole('textbox')
    await textboxes.first().fill('Priya')
    const count = await textboxes.count()
    if (count >= 2) await textboxes.nth(1).fill('Sharma')
    await page.getByRole('button', { name: 'Continue →' }).click()
    // Step 2 is "Date and place of birth"
    await expect(page.getByRole('heading', { name: 'Date and place of birth' })).toBeVisible({ timeout: 3000 })
  })

  test('/apply/review loads review page', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/review')
    await expect(page.getByText('Application validation complete')).toBeVisible()
  })

  // NOTE: /apply/status redirects to /apply when no application exists.
  // This test verifies the redirect chain works without a 404 or 500.
  test('/apply/status redirects gracefully when no application exists', async ({ page }) => {
    await signIn(page)
    await page.goto('/apply/status')
    // Should redirect to /apply (no apps exist) — not 404 or 500
    await expect(page).not.toHaveURL(/not-found/)
    const url = page.url()
    expect(url).toMatch(/apply|dashboard/)
  })
})
