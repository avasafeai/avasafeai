import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from './helpers'

let userId: string

test.describe('Auth — signup and login', () => {
  test.beforeAll(async () => {
    userId = await createTestUser()
  })

  test.afterAll(async () => {
    await deleteTestUser(userId)
  })

  test('auth page loads with sign in form by default', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Use submit button type to avoid ambiguity with the tab pill "Sign in" button
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('signup mode shows full name field', async ({ page }) => {
    // ?mode=signup sets the initial mode to signup directly
    await page.goto('/auth?mode=signup')
    // The page initialises in signup mode — "Create your account" heading and name field visible
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.locator('input[placeholder="Priya Sharma"]')).toBeVisible()
  })

  test('magic link mode hides password field', async ({ page }) => {
    await page.goto('/auth')
    await page.getByText('Sign in with magic link').click()
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible()
  })

  test('can switch back from magic link to password', async ({ page }) => {
    await page.goto('/auth')
    await page.getByText('Sign in with magic link').click()
    await page.getByText('Back to password sign in').click()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('sign in with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/auth')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test('sign in with wrong password shows error', async ({ page }) => {
    await page.goto('/auth')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/auth/)
    // Error may be "Incorrect email or password" or rate-limit message
    await expect(
      page.locator('[role="alert"], p').filter({ hasText: /incorrect|invalid|wrong|too many|please wait/i })
    ).toBeVisible({ timeout: 6_000 })
  })

  test('unauthenticated access to /dashboard redirects to /auth', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 })
  })

  test('unauthenticated access to /onboarding redirects to /auth', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 })
  })
})
