import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, TEST_EMAIL, TEST_PASSWORD } from './helpers'

let userId: string

test.describe('Navigation — no 404s, correct redirects', () => {
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

  // Public routes
  test('GET / returns 200', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
  })

  test('GET /auth returns 200', async ({ page }) => {
    const res = await page.goto('/auth')
    expect(res?.status()).toBe(200)
  })

  test('GET /auth?mode=signup returns 200', async ({ page }) => {
    const res = await page.goto('/auth?mode=signup')
    expect(res?.status()).toBe(200)
  })

  // Protected routes — unauthenticated should redirect, not 404
  test('GET /dashboard redirects to /auth when not logged in', async ({ page }) => {
    const res = await page.goto('/dashboard')
    expect(res?.status()).not.toBe(404)
    await expect(page).toHaveURL(/\/auth/)
  })

  test('GET /onboarding redirects to /auth when not logged in', async ({ page }) => {
    const res = await page.goto('/onboarding')
    expect(res?.status()).not.toBe(404)
    await expect(page).toHaveURL(/\/auth/)
  })

  test('GET /apply redirects to /auth when not logged in', async ({ page }) => {
    const res = await page.goto('/apply')
    expect(res?.status()).not.toBe(404)
    await expect(page).toHaveURL(/\/auth/)
  })

  // Protected routes — authenticated
  test('authenticated /dashboard returns 200', async ({ page }) => {
    await signIn(page)
    const res = await page.goto('/dashboard')
    expect(res?.status()).toBe(200)
  })

  test('authenticated /onboarding returns 200', async ({ page }) => {
    await signIn(page)
    const res = await page.goto('/onboarding')
    expect(res?.status()).toBe(200)
  })

  test('authenticated /apply returns 200', async ({ page }) => {
    await signIn(page)
    const res = await page.goto('/apply')
    expect(res?.status()).toBe(200)
  })

  test('authenticated /apply/form returns 200', async ({ page }) => {
    await signIn(page)
    const res = await page.goto('/apply/form')
    expect(res?.status()).toBe(200)
  })

  test('landing page CTA "Start for free" points to /auth?mode=signup', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('a[href="/auth?mode=signup"]').first()
    await expect(cta).toBeVisible()
  })

  test('no /not-found on any primary route when authenticated', async ({ page }) => {
    await signIn(page)
    for (const path of ['/dashboard', '/onboarding', '/apply']) {
      await page.goto(path)
      await expect(page).not.toHaveURL(/not-found/)
    }
  })
})
