import { test, expect } from '@playwright/test'

/**
 * Apply form tests — these visit /apply/form directly (client component, no server auth).
 * Service selection (/apply) requires auth — tested in 06-apply-flow.spec.ts.
 */

test.describe('Apply — multi-step form (direct navigation)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apply/form')
  })

  test('renders step 1 with AVA voice bubble', async ({ page }) => {
    const avaBadge = page.getByText('AVA').first()
    await expect(avaBadge).toBeVisible()
  })

  test('renders step counter in header', async ({ page }) => {
    await expect(page.getByText(/Step 1 of/i)).toBeVisible()
  })

  test('first step heading is "Your name"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your name' })).toBeVisible()
  })

  test('Continue button is disabled with empty required fields', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: 'Continue →' })
    await expect(continueBtn).toBeDisabled()
  })

  test('filling both name fields enables Continue', async ({ page }) => {
    const textboxes = page.getByRole('textbox')
    await textboxes.first().fill('Priya')
    const count = await textboxes.count()
    if (count >= 2) await textboxes.nth(1).fill('Sharma')
    const continueBtn = page.getByRole('button', { name: 'Continue →' })
    await expect(continueBtn).toBeEnabled({ timeout: 2000 })
  })

  test('Back button appears and is disabled on step 1', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()
  })

  test('Back becomes enabled after advancing to step 2', async ({ page }) => {
    const textboxes = page.getByRole('textbox')
    await textboxes.first().fill('Priya')
    const count = await textboxes.count()
    if (count >= 2) await textboxes.nth(1).fill('Sharma')
    await page.getByRole('button', { name: 'Continue →' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: 'Back' })).toBeEnabled()
  })

  test('step 3 (gender) renders option buttons, not a text input', async ({ page }) => {
    // Navigate through steps 1 and 2 to reach gender
    // Step 1: name
    const textboxes = page.getByRole('textbox')
    await textboxes.first().fill('Priya')
    if (await textboxes.count() >= 2) await textboxes.nth(1).fill('Sharma')
    await page.getByRole('button', { name: 'Continue →' }).click()
    await page.waitForTimeout(300)

    // Step 2: date + place
    await page.locator('input[type="date"]').first().fill('1990-01-15')
    const placeInput = page.getByRole('textbox')
    if (await placeInput.count() > 0) await placeInput.first().fill('Mumbai, India')
    await page.getByRole('button', { name: 'Continue →' }).click()
    await page.waitForTimeout(300)

    // Step 3: gender — option buttons, not text input
    await expect(page.getByText(/male|female/i).first()).toBeVisible()
    // Should NOT have a text input for gender
    const textInput = page.locator('input[type="text"]')
    expect(await textInput.count()).toBe(0)
  })
})

test.describe('Apply — payment page', () => {
  test('renders order summary and pay button', async ({ page }) => {
    await page.goto('/apply/payment')
    await expect(page.getByText(/order summary/i)).toBeVisible()
    await expect(page.getByText(/\$29/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Pay.*\$29|pay.*secure|pay/i })).toBeVisible()
  })

  test('shows rejection guarantee badge', async ({ page }) => {
    await page.goto('/apply/payment')
    await expect(page.getByText(/rejection guarantee/i)).toBeVisible()
  })

  test('shows Stripe security note', async ({ page }) => {
    await page.goto('/apply/payment')
    await expect(page.getByText(/Stripe/i)).toBeVisible()
  })
})

test.describe('Apply — review page', () => {
  test('renders review heading and validation loading state', async ({ page }) => {
    await page.goto('/apply/review')
    await expect(page.getByText('Review your application')).toBeVisible()
  })

  test('shows rejection guarantee', async ({ page }) => {
    await page.goto('/apply/review')
    await expect(page.getByText(/rejection guarantee/i)).toBeVisible()
  })
})
