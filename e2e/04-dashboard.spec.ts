import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from './helpers'

let userId: string

test.describe('Dashboard', () => {
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

  test('dashboard loads and shows Document Locker heading', async ({ page }) => {
    await signIn(page)
    // Use heading role to avoid strict-mode violation with sidebar link
    await expect(page.getByRole('heading', { name: 'Document Locker' })).toBeVisible()
  })

  test('shows welcome back message (name or fallback)', async ({ page }) => {
    await signIn(page)
    // The dashboard shows either the first name from the profile or "there" as fallback
    // when the profiles table doesn't yet have a row. Accept either.
    const firstName = TEST_NAME.split(' ')[0]
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    const text = await heading.textContent()
    expect(text).toMatch(new RegExp(`Welcome back|${firstName}`, 'i'))
  })

  test('empty locker state shows warm copy and CTA', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('Your locker is ready.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add your first document' })).toBeVisible()
  })

  test('empty applications section shows start application CTA', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('Ready to apply for your OCI card?')).toBeVisible()
    await expect(page.getByRole('link', { name: /Start now/i })).toBeVisible()
  })

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'My Documents' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alerts' })).toBeVisible()
  })

  test('Avasafe AI logo link is present', async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('link', { name: 'Avasafe AI' })).toBeVisible()
  })

  test('Add document link is present', async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('link', { name: 'Add document' }).first()).toBeVisible()
  })
})
