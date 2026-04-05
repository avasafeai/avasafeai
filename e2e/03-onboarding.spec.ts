import { test, expect } from '@playwright/test'
import path from 'path'
import { createTestUser, deleteTestUser, TEST_EMAIL, TEST_PASSWORD } from './helpers'

let userId: string

test.describe('Onboarding — passport upload and extraction', () => {
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

  test('onboarding page loads with AVA greeting', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    await expect(page.getByText(/Hi, I'm AVA/i)).toBeVisible()
  })

  test('shows upload zone with correct hint text', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    await expect(page.getByText('Upload your US passport')).toBeVisible()
    await expect(page.getByText(/PDF, JPG, or PNG/)).toBeVisible()
    await expect(page.getByText('Max 10MB')).toBeVisible()
  })

  test('extract button is disabled with no file selected', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    const btn = page.getByRole('button', { name: 'Read my passport' })
    await expect(btn).toBeDisabled()
  })

  test('progress bar renders at start of page', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    // Step indicator text is visible
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })

  test('file upload zone shows file name after selection', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    const fileInput = page.locator('input[type="file"]')
    const fixture = path.join(__dirname, 'fixtures', 'sample-passport.jpg')
    await fileInput.setInputFiles(fixture)
    await expect(page.getByText('sample-passport.jpg')).toBeVisible()
  })

  test('extract button enables after file selection', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    const fileInput = page.locator('input[type="file"]')
    const fixture = path.join(__dirname, 'fixtures', 'sample-passport.jpg')
    await fileInput.setInputFiles(fixture)
    const btn = page.getByRole('button', { name: 'Read my passport' })
    await expect(btn).toBeEnabled()
  })

  test('clicking extract shows loading animation', async ({ page }) => {
    await signIn(page)
    await page.goto('/onboarding')
    const fileInput = page.locator('input[type="file"]')
    const fixture = path.join(__dirname, 'fixtures', 'sample-passport.jpg')
    await fileInput.setInputFiles(fixture)
    await page.getByRole('button', { name: 'Read my passport' }).click()
    await expect(page.getByText(/Reading your passport/i)).toBeVisible({ timeout: 5_000 })
  })

  // NOTE: This test calls the real Claude API with a real passport image.
  // It is skipped by default — pass PASSPORT_IMAGE env var with a path to run it.
  test('after extraction shows editable fields and confirm button', async ({ page }) => {
    test.skip(!process.env.PASSPORT_IMAGE, 'Requires real passport image: set PASSPORT_IMAGE=/path/to/passport.jpg')

    await signIn(page)
    await page.goto('/onboarding')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(process.env.PASSPORT_IMAGE!)
    await page.getByRole('button', { name: 'Read my passport' }).click()

    await expect(page.getByText(/I've read your passport/i)).toBeVisible({ timeout: 40_000 })
    await expect(page.getByText('Full name')).toBeVisible()
    await expect(page.getByText('Passport number')).toBeVisible()
    await expect(page.getByText('From your passport').first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Confirm and go to my locker/i })
    ).toBeVisible({ timeout: 5_000 })
  })
})
