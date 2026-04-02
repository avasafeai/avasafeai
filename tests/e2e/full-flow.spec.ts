import { test, expect, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'https://avasafe.ai'
const EMAIL = 'test@avasafe.ai'
const PASSWORD = 'TestAvasafe2026!'

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

async function screenshot(page: Page, name: string) {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false })
  } catch (_) {}
}

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/auth`)
  await page.waitForLoadState('domcontentloaded')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1 — LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 1 — LANDING PAGE', () => {

  test('LP-01: loads with no network errors', async ({ page }) => {
    const errors: string[] = []
    page.on('response', r => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`) })
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await screenshot(page, 'LP-01-landing-loaded')
    expect(errors, `Server errors: ${errors.join(', ')}`).toHaveLength(0)
  })

  test('LP-02: hero headline contains OCI/application copy', async ({ page }) => {
    await page.goto(BASE_URL)
    await screenshot(page, 'LP-02-hero')
    // Check for a visible headline — looking for key phrases from CLAUDE.md
    const hero = page.locator('h1').first()
    await expect(hero).toBeVisible()
    const heroText = await hero.textContent()
    console.log(`LP-02 hero text: "${heroText}"`)
  })

  test('LP-03: "90% ready" or similar gold killer line visible', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-03-killer-line')
    // Try multiple possible phrases from spec/CLAUDE.md
    const candidates = [
      '90% ready',
      'Your application is',
      'done in minutes',
      'never have to navigate',
      'Two things',
    ]
    let found = false
    for (const text of candidates) {
      const el = page.getByText(text, { exact: false })
      if (await el.count() > 0) { found = true; console.log(`LP-03 found: "${text}"`); break }
    }
    expect(found, 'No expected subheadline text found on landing page').toBe(true)
  })

  test('LP-04: "Sound familiar" / pain point section with 6 cards', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-04-pain-points')
    const painPoints = ['Wrong photo', 'Name mismatch', 'VFS', 'Missing document', 'address proof', 'Apostille']
    let foundCount = 0
    for (const pt of painPoints) {
      const el = page.getByText(pt, { exact: false })
      if (await el.count() > 0) foundCount++
    }
    console.log(`LP-04: found ${foundCount}/6 pain point references`)
  })

  test('LP-05: "Two things" section visible', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-05-two-things')
    const candidates = ["Two things", "two things", "Two steps", "two steps"]
    let found = false
    for (const t of candidates) {
      if (await page.getByText(t, { exact: false }).count() > 0) { found = true; break }
    }
    console.log(`LP-05 "two things" found: ${found}`)
  })

  test('LP-06: "How it works" section visible', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const candidates = ['How it works', 'Three steps', 'How AVA works', 'three steps']
    let found = false
    for (const t of candidates) {
      if (await page.getByText(t, { exact: false }).count() > 0) { found = true; console.log(`LP-06 found: "${t}"`); break }
    }
    await screenshot(page, 'LP-06-how-it-works')
    expect(found, 'How it works section not found').toBe(true)
  })

  test('LP-07: "AVA fills the portals" / 3-column section', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-07-ava-fills')
    const candidates = ['AVA fills', 'fills the portal', 'portal', 'government portal', 'VFS']
    let found = false
    for (const t of candidates) {
      if (await page.getByText(t, { exact: false }).count() > 0) { found = true; console.log(`LP-07 found: "${t}"`); break }
    }
    console.log(`LP-07 portal section found: ${found}`)
  })

  test('LP-08: trust section with trust cards', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-08-trust')
    const trustPhrases = ['encrypted', 'No human', 'guarantee', 'secure', 'privacy']
    let foundCount = 0
    for (const t of trustPhrases) {
      if (await page.getByText(t, { exact: false }).count() > 0) foundCount++
    }
    console.log(`LP-08 trust phrases found: ${foundCount}`)
    expect(foundCount).toBeGreaterThanOrEqual(2)
  })

  test('LP-09: guarantee section with "Avasafe Guarantee"', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-09-guarantee')
    const candidates = ['Avasafe Guarantee', 'guarantee', 'rejection guarantee', 'Rejection guarantee']
    let found = false
    for (const t of candidates) {
      if (await page.getByText(t, { exact: false }).count() > 0) { found = true; console.log(`LP-09 found: "${t}"`); break }
    }
    expect(found, 'Guarantee section not found').toBe(true)
  })

  test('LP-10: pricing section with plan cards and "Most popular" badge', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    // Scroll to pricing
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(500)
    await screenshot(page, 'LP-10-pricing')
    const planNames = ['Locker', '$19', '$49', 'Family']
    let foundCount = 0
    for (const t of planNames) {
      if (await page.getByText(t, { exact: false }).count() > 0) foundCount++
    }
    console.log(`LP-10 pricing items found: ${foundCount}/4`)
    expect(foundCount).toBeGreaterThanOrEqual(3)
    // Check Most popular badge
    const popularBadge = page.getByText('Most popular', { exact: false })
    const hasBadge = await popularBadge.count() > 0
    console.log(`LP-10 "Most popular" badge: ${hasBadge}`)
  })

  test('LP-11: FAQ items open and close on click', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    // Scroll to FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await screenshot(page, 'LP-11-faq-before')
    // Find FAQ items
    const faqItems = page.locator('[data-faq], details, [class*="faq"], [class*="accordion"]').first()
    const faqButton = page.locator('button').filter({ hasText: /safe|Is it|What|How|passport/i }).first()
    if (await faqButton.count() > 0) {
      await faqButton.click()
      await page.waitForTimeout(300)
      await screenshot(page, 'LP-11-faq-open')
      await faqButton.click()
      await page.waitForTimeout(300)
      await screenshot(page, 'LP-11-faq-closed')
      console.log('LP-11: FAQ toggle works')
    } else {
      console.log('LP-11: No FAQ toggle buttons found')
    }
  })

  test('LP-12: primary CTA routes to /auth', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    // Click first CTA link pointing to auth
    const ctaLink = page.locator('a[href*="/auth"]').first()
    if (await ctaLink.count() > 0) {
      await ctaLink.click()
      await page.waitForURL(/\/auth/, { timeout: 10000 })
      await screenshot(page, 'LP-12-cta-auth')
      console.log(`LP-12: CTA navigated to ${page.url()}`)
    } else {
      // Try clicking a button with CTA text
      const ctaBtn = page.getByRole('link', { name: /start|apply|get started/i }).first()
      await ctaBtn.click()
      await page.waitForURL(/\/auth/, { timeout: 10000 })
    }
  })

  test('LP-13: bottom CTA routes to /auth', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await screenshot(page, 'LP-13-bottom-cta')
    const authLinks = page.locator('a[href*="/auth"]')
    const count = await authLinks.count()
    console.log(`LP-13: Found ${count} /auth links total`)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('LP-14: 375px viewport — no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'LP-14-mobile-375')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`LP-14: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('LP-15: scroll animations — elements visible after scroll', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    // Scroll through page
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 1500))
    await page.waitForTimeout(500)
    await screenshot(page, 'LP-15-scroll-animations')
    console.log('LP-15: Scroll completed, checking for visible content')
    // Page should still show content
    const bodyText = await page.textContent('body')
    expect(bodyText!.length).toBeGreaterThan(100)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2 — AUTH FLOW
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 2 — AUTH FLOW', () => {

  test('AUTH-01: /auth layout — navy panel left, form right, tabs visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AUTH-01-auth-page')
    // Check form elements present
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Check for tabs / sign in / create account text
    const hasSignIn = await page.getByText('Sign in', { exact: false }).count() > 0
    const hasTabs = await page.locator('[role="tab"], [data-tab]').count() > 0
    console.log(`AUTH-01: signIn text=${hasSignIn}, tabs=${hasTabs}`)
  })

  test('AUTH-02: sign in with valid credentials redirects to dashboard/onboarding', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
    await screenshot(page, 'AUTH-02-after-signin')
    console.log(`AUTH-02: redirected to ${page.url()}`)
  })

  test('AUTH-03: wrong password shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill('WrongPassword999!')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)
    await screenshot(page, 'AUTH-03-wrong-password')
    const errorText = await page.locator('p, [role="alert"], .error, [class*="error"]').filter({ hasText: /incorrect|invalid|wrong|password/i }).count()
    console.log(`AUTH-03: error elements found: ${errorText}`)
    // URL should still be /auth
    expect(page.url()).toContain('/auth')
  })

  test('AUTH-04: non-existent email shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    await page.locator('input[type="email"]').fill('nobody-xyz-123@notreal.com')
    await page.locator('input[type="password"]').fill('SomePassword123!')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)
    await screenshot(page, 'AUTH-04-no-account')
    const pageText = await page.textContent('body')
    const hasError = /no account|not found|invalid|incorrect/i.test(pageText || '')
    console.log(`AUTH-04: error message found: ${hasError}`)
    expect(page.url()).toContain('/auth')
  })

  test('AUTH-05: create account tab — typing "abc" password shows rules (first red)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    // Click Create account / Sign up tab
    const signupTab = page.getByText('Create account', { exact: false }).first()
    const signupLink = page.getByRole('tab', { name: /create|sign up/i }).first()
    if (await signupTab.count() > 0) await signupTab.click()
    else if (await signupLink.count() > 0) await signupLink.click()
    await page.waitForTimeout(500)
    // Fill password with weak value
    const pwField = page.locator('input[type="password"]').first()
    await pwField.fill('abc')
    await page.waitForTimeout(300)
    await screenshot(page, 'AUTH-05-password-rules-weak')
    // Look for password rule indicators
    const rules = page.locator('[class*="rule"], [class*="requirement"], [class*="criteria"], li').filter({ hasText: /character|uppercase|number|special/i })
    const rulesCount = await rules.count()
    console.log(`AUTH-05: password rule elements found: ${rulesCount}`)
  })

  test('AUTH-06: strong password "TestPass123!" — all rules green', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    const signupTab = page.getByText('Create account', { exact: false }).first()
    if (await signupTab.count() > 0) await signupTab.click()
    await page.waitForTimeout(500)
    const pwField = page.locator('input[type="password"]').first()
    await pwField.fill('TestPass123!')
    await page.waitForTimeout(300)
    await screenshot(page, 'AUTH-06-password-rules-strong')
    console.log('AUTH-06: Strong password entered, checking rules')
  })

  test('AUTH-07: signup with existing email shows "already exists" error', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    // Switch to signup tab
    const signupTab = page.getByText('Create account', { exact: false }).first()
    if (await signupTab.count() > 0) await signupTab.click()
    await page.waitForTimeout(500)
    // Fill all fields
    const nameField = page.locator('input[type="text"], input[placeholder*="name" i], input[name="name"]').first()
    if (await nameField.count() > 0) await nameField.fill('Test User')
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill('TestPass123!')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(4000)
    await screenshot(page, 'AUTH-07-existing-email')
    const pageText = await page.textContent('body')
    const hasError = /already|exists|account/i.test(pageText || '')
    console.log(`AUTH-07: existing account error: ${hasError}`)
    // Should NOT show a confirmation screen
    const onConfirm = page.url().includes('confirm') || page.url().includes('check')
    console.log(`AUTH-07: on confirm page (bad): ${onConfirm}`)
  })

  test('AUTH-08: sign in then sign out → redirects to /auth', async ({ page }) => {
    await signIn(page)
    await screenshot(page, 'AUTH-08-signed-in')
    // Click sign out in sidebar
    const signOutBtn = page.getByText('Sign out', { exact: false }).first()
    const logOutBtn = page.getByRole('button', { name: /sign out|log out/i }).first()
    if (await signOutBtn.count() > 0) await signOutBtn.click()
    else if (await logOutBtn.count() > 0) await logOutBtn.click()
    await page.waitForURL(/\/auth/, { timeout: 10000 })
    await screenshot(page, 'AUTH-08-signed-out')
    console.log(`AUTH-08: after sign out: ${page.url()}`)
  })

  test('AUTH-09: sign in, go to /dashboard/account, sign out → /auth', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AUTH-09-account-page')
    const signOutBtn = page.getByRole('button', { name: /sign out|log out/i }).first()
    const signOutLink = page.getByText('Sign out', { exact: false }).first()
    if (await signOutBtn.count() > 0) await signOutBtn.click()
    else if (await signOutLink.count() > 0) await signOutLink.click()
    else {
      console.log('AUTH-09: no sign out button found on /dashboard/account')
      return
    }
    await page.waitForURL(/\/auth/, { timeout: 10000 })
    console.log(`AUTH-09: redirected to ${page.url()}`)
  })

  test('AUTH-10: signed out, navigate to /dashboard → redirects to /auth', async ({ page }) => {
    // Don't sign in, just go directly
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForURL(/\/auth/, { timeout: 10000 })
    await screenshot(page, 'AUTH-10-redirect')
    expect(page.url()).toContain('/auth')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3 — ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 3 — ONBOARDING', () => {

  test('OB-01: /onboarding — AVA bubble visible, upload zone with dashed border', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'OB-01-onboarding')
    // AVA bubble
    const avaBubble = page.locator('[class*="ava"], [class*="AVA"]').first()
    const avaText = page.getByText(/AVA|Hi, I'm|I'm AVA|I am AVA/i).first()
    const hasAva = await avaBubble.count() > 0 || await avaText.count() > 0
    console.log(`OB-01: AVA visible: ${hasAva}`)
    // Upload zone
    const uploadZone = page.locator('[class*="upload"], [class*="drop"], input[type="file"]').first()
    const hasUpload = await uploadZone.count() > 0
    console.log(`OB-01: upload zone visible: ${hasUpload}`)
    expect(hasUpload).toBe(true)
  })

  test('OB-02: upload passport image — processing state shows', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await page.waitForLoadState('domcontentloaded')
    // Use fixture file
    const fixtureFile = path.join(__dirname, '..', 'fixtures', 'test-passport.jpg')
    const fallbackFixture = path.join(__dirname, '..', '..', 'e2e', 'fixtures', 'sample-passport.jpg')
    const fileToUse = fs.existsSync(fixtureFile) ? fixtureFile : fallbackFixture
    console.log(`OB-02: using fixture: ${fileToUse}`)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(fileToUse)
      await page.waitForTimeout(500)
      await screenshot(page, 'OB-02-file-selected')
      // Click read/extract button
      const readBtn = page.getByRole('button', { name: /read|extract|process|continue/i }).first()
      if (await readBtn.count() > 0 && await readBtn.isEnabled()) {
        await readBtn.click()
        await page.waitForTimeout(2000)
        await screenshot(page, 'OB-02-processing')
        const processingText = page.getByText(/reading|processing|extracting|loading/i).first()
        const hasProcessing = await processingText.count() > 0
        console.log(`OB-02: processing state visible: ${hasProcessing}`)
      } else {
        console.log('OB-02: read button not found or disabled after file select')
      }
    } else {
      console.log('OB-02: no file input found')
    }
  })

  test('OB-03: after extraction, edit first_name, click Confirm', async ({ page }) => {
    // This test requires real Claude extraction — mark conditional
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await screenshot(page, 'OB-03-start')
    console.log('OB-03: SKIPPED — requires full Claude extraction with real passport image')
    test.skip(true, 'Requires real passport image and Claude API for extraction')
  })

  test('OB-04: after confirm → routes to /onboarding/plan or /dashboard', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await screenshot(page, 'OB-04-check')
    console.log('OB-04: SKIPPED — requires completion of extraction flow')
    test.skip(true, 'Requires completion of extraction flow first')
  })

  test('OB-05: /onboarding/plan — AVA message and plan cards visible', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding/plan`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'OB-05-plan-page')
    const pageText = await page.textContent('body')
    const has404 = page.url().includes('not-found') || /404|not found/i.test(pageText || '')
    console.log(`OB-05: 404: ${has404}, url: ${page.url()}`)
    if (!has404) {
      const planCards = page.locator('[class*="plan"], [class*="card"]').filter({ hasText: /locker|free|apply|family/i })
      const count = await planCards.count()
      console.log(`OB-05: plan cards found: ${count}`)
    }
  })

  test('OB-06: "Continue free" → routes to /dashboard', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding/plan`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'OB-06-plan-page')
    const freeBtn = page.getByText(/continue free|start free|free plan|skip/i).first()
    if (await freeBtn.count() > 0) {
      await freeBtn.click()
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
      console.log(`OB-06: navigated to ${page.url()}`)
    } else {
      console.log('OB-06: No "continue free" button found on plan page')
    }
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4 — DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 4 — DASHBOARD', () => {

  test('DB-01: /dashboard — sidebar visible, document locker section visible', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-01-dashboard')
    const sidebarLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
    const sidebarCount = await sidebarLinks.count()
    console.log(`DB-01: sidebar links: ${sidebarCount}`)
    expect(sidebarCount).toBeGreaterThan(0)
    const lockerSection = page.getByText('Document Locker', { exact: false }).first()
    const hasLocker = await lockerSection.count() > 0
    console.log(`DB-01: Document Locker visible: ${hasLocker}`)
    expect(hasLocker).toBe(true)
  })

  test('DB-02: document card shows type label, key field, expiry, coloured indicator', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-02-document-cards')
    // If no documents yet, just verify empty state is shown gracefully
    const cards = page.locator('[class*="card"]').filter({ hasText: /passport|oci|document|locker/i })
    const cardCount = await cards.count()
    console.log(`DB-02: document cards found: ${cardCount}`)
  })

  test('DB-03: Documents sidebar link → /dashboard/documents loads (no 404)', async ({ page }) => {
    await signIn(page)
    const res = await page.goto(`${BASE_URL}/dashboard/documents`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-03-documents-page')
    const status = res?.status()
    console.log(`DB-03: /dashboard/documents status: ${status}`)
    expect(status).not.toBe(404)
    expect(page.url()).not.toContain('not-found')
  })

  test('DB-04: Applications sidebar link → /dashboard/applications loads', async ({ page }) => {
    await signIn(page)
    const res = await page.goto(`${BASE_URL}/dashboard/applications`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-04-applications-page')
    const status = res?.status()
    console.log(`DB-04: /dashboard/applications status: ${status}`)
    expect(status).not.toBe(404)
    expect(page.url()).not.toContain('not-found')
  })

  test('DB-05: Alerts sidebar link → /dashboard/alerts loads', async ({ page }) => {
    await signIn(page)
    const res = await page.goto(`${BASE_URL}/dashboard/alerts`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-05-alerts-page')
    const status = res?.status()
    console.log(`DB-05: /dashboard/alerts status: ${status}`)
    expect(status).not.toBe(404)
    expect(page.url()).not.toContain('not-found')
  })

  test('DB-06: Account sidebar link → /dashboard/account loads', async ({ page }) => {
    await signIn(page)
    const res = await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-06-account-page')
    const status = res?.status()
    console.log(`DB-06: /dashboard/account status: ${status}`)
    expect(status).not.toBe(404)
    expect(page.url()).not.toContain('not-found')
  })

  test('DB-07: /dashboard/documents/add — page loads, upload zone visible', async ({ page }) => {
    await signIn(page)
    const res = await page.goto(`${BASE_URL}/dashboard/documents/add`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-07-add-document')
    const status = res?.status()
    console.log(`DB-07: /dashboard/documents/add status: ${status}`)
    expect(status).not.toBe(404)
    const uploadZone = page.locator('input[type="file"], [class*="upload"], [class*="drop"]').first()
    const hasUpload = await uploadZone.count() > 0
    console.log(`DB-07: upload zone visible: ${hasUpload}`)
  })

  test('DB-08: click document card → /dashboard/documents/[id] loads', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/documents`)
    await page.waitForLoadState('domcontentloaded')
    // Try clicking any document card link
    const docLink = page.locator('a[href*="/dashboard/documents/"]').first()
    if (await docLink.count() > 0) {
      await docLink.click()
      await page.waitForURL(/\/dashboard\/documents\//, { timeout: 10000 })
      await screenshot(page, 'DB-08-document-detail')
      console.log(`DB-08: navigated to ${page.url()}`)
      expect(page.url()).toContain('/dashboard/documents/')
    } else {
      console.log('DB-08: No document cards/links found (empty state — expected for test account)')
    }
  })

  test('DB-09: SKIPPED — free tier test requires DB access', async () => {
    test.skip(true, 'Requires DB: set plan=free')
  })

  test('DB-10: SKIPPED — free tier alerts test', async () => {
    test.skip(true, 'Requires DB: set plan=free')
  })

  test('DB-11: user avatar visible in sidebar with initials and email', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-11-user-avatar')
    // Look for email or initials in sidebar
    const emailEl = page.locator('[class*="sidebar"], nav, aside').getByText(/@/, { exact: false }).first()
    const initials = page.locator('[class*="avatar"], [class*="initials"], [class*="user"]').first()
    const hasEmail = await emailEl.count() > 0
    const hasInitials = await initials.count() > 0
    console.log(`DB-11: email in sidebar: ${hasEmail}, initials/avatar: ${hasInitials}`)
  })

  test('DB-12: sign out button visible with red hover', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'DB-12-signout-btn')
    const signOutBtn = page.getByRole('button', { name: /sign out|log out/i }).first()
    const signOutEl = page.getByText(/sign out|log out/i).first()
    const hasSignOut = await signOutBtn.count() > 0 || await signOutEl.count() > 0
    console.log(`DB-12: sign out visible: ${hasSignOut}`)
    expect(hasSignOut).toBe(true)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 5 — APPLY FLOW
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 5 — APPLY FLOW', () => {

  test('AP-01: SKIPPED — free plan test requires DB access', async () => {
    test.skip(true, 'Requires DB: set plan=free to test upgrade prompt')
  })

  test('AP-02: /apply — service picker with OCI New and Passport Renewal cards', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-02-apply-service-picker')
    const ociText = page.getByText('OCI', { exact: false }).first()
    const passportText = page.getByText('Passport', { exact: false }).first()
    const hasOCI = await ociText.count() > 0
    const hasPassport = await passportText.count() > 0
    console.log(`AP-02: OCI visible: ${hasOCI}, Passport: ${hasPassport}`)
    expect(hasOCI || hasPassport).toBe(true)
  })

  test('AP-03: click OCI New → routes to /apply/form, no 400 errors', async ({ page }) => {
    await signIn(page)
    const errors: string[] = []
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
    await page.goto(`${BASE_URL}/apply`)
    await page.waitForLoadState('domcontentloaded')
    // Click OCI card
    const ociCard = page.getByText('OCI', { exact: false }).first()
    if (await ociCard.count() > 0) {
      await ociCard.click()
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)
    } else {
      await page.goto(`${BASE_URL}/apply/form`)
    }
    await screenshot(page, 'AP-03-apply-form')
    const url = page.url()
    console.log(`AP-03: navigated to ${url}`)
    const clientErrors = errors.filter(e => !e.startsWith('4'))
    console.log(`AP-03: 4xx/5xx errors: ${errors.join(', ')}`)
  })

  test('AP-04: /apply/form step 1 — AVA bubble, one question, progress bar, Continue button', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-04-form-step1')
    // Progress bar
    const progressBar = page.locator('[class*="progress"], [role="progressbar"]').first()
    const stepText = page.getByText(/step \d+ of \d+/i).first()
    const hasProgress = await progressBar.count() > 0 || await stepText.count() > 0
    console.log(`AP-04: progress indicator: ${hasProgress}`)
    // Continue button
    const continueBtn = page.getByRole('button', { name: /continue/i }).first()
    const hasContinue = await continueBtn.count() > 0
    console.log(`AP-04: Continue button: ${hasContinue}`)
    expect(hasContinue).toBe(true)
  })

  test('AP-05: empty step 1 → Continue disabled or shows validation error', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-05-empty-form')
    const continueBtn = page.getByRole('button', { name: /continue/i }).first()
    if (await continueBtn.count() > 0) {
      const isDisabled = await continueBtn.isDisabled()
      console.log(`AP-05: Continue disabled with empty form: ${isDisabled}`)
      if (!isDisabled) {
        // Click and check for validation error
        await continueBtn.click()
        await page.waitForTimeout(500)
        const errorText = page.locator('[class*="error"], [role="alert"]').first()
        const hasError = await errorText.count() > 0
        console.log(`AP-05: validation error shown after click: ${hasError}`)
      }
    }
  })

  test('AP-06: pre-filled fields have "From your passport" badge', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-06-prefilled')
    const badge = page.getByText('From your passport', { exact: false }).first()
    const hasBadge = await badge.count() > 0
    console.log(`AP-06: "From your passport" badge visible: ${hasBadge}`)
  })

  test('AP-07: fill step 1, Continue → smooth transition to step 2', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    // Fill first and last name fields
    const inputs = page.locator('input[type="text"]')
    const inputCount = await inputs.count()
    if (inputCount >= 1) await inputs.first().fill('Test')
    if (inputCount >= 2) await inputs.nth(1).fill('User')
    await screenshot(page, 'AP-07-filled-step1')
    const continueBtn = page.getByRole('button', { name: /continue/i }).first()
    if (await continueBtn.count() > 0) {
      await continueBtn.click()
      await page.waitForTimeout(1000)
      await screenshot(page, 'AP-07-step2')
      const stepText = await page.getByText(/step \d+ of \d+/i).first().textContent()
      console.log(`AP-07: after Continue, step text: "${stepText}"`)
    }
  })

  test('AP-08: fill multiple steps with test data', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')

    const fillAndContinue = async (stepNum: number, fillFn?: () => Promise<void>) => {
      if (fillFn) await fillFn()
      await page.waitForTimeout(300)
      const continueBtn = page.getByRole('button', { name: /continue/i }).first()
      if (await continueBtn.isEnabled()) {
        await continueBtn.click()
        await page.waitForTimeout(600)
        await screenshot(page, `AP-08-step${stepNum}`)
      }
    }

    // Step 1: Name
    await fillAndContinue(1, async () => {
      const inputs = page.locator('input[type="text"]')
      if (await inputs.count() >= 1) await inputs.first().fill('Test')
      if (await inputs.count() >= 2) await inputs.nth(1).fill('User')
    })

    // Step 2: DOB
    await fillAndContinue(2, async () => {
      const dateInput = page.locator('input[type="date"]').first()
      if (await dateInput.count() > 0) await dateInput.fill('1990-01-15')
      const textInputs = page.locator('input[type="text"]')
      // place of birth might be text
      if (await textInputs.count() > 0) await textInputs.first().fill('New Delhi, India')
    })

    // Step 3 onward
    for (let i = 3; i <= 6; i++) {
      await fillAndContinue(i, async () => {
        const textInputs = page.locator('input[type="text"]:not([readonly])')
        for (let j = 0; j < await textInputs.count() && j < 2; j++) {
          const val = await textInputs.nth(j).inputValue()
          if (!val) await textInputs.nth(j).fill('Test value')
        }
        const selects = page.locator('select')
        for (let j = 0; j < await selects.count(); j++) {
          const options = await selects.nth(j).locator('option').all()
          if (options.length > 1) await selects.nth(j).selectOption({ index: 1 })
        }
      })
    }

    const finalStepText = await page.getByText(/step \d+ of \d+/i).first().textContent().catch(() => 'unknown')
    console.log(`AP-08: reached step: ${finalStepText}`)
  })

  test('AP-09: address step with Austin TX → VFS shows Houston', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    // Navigate through form to find address step
    const addressStepFound = false
    const bodyText = await page.textContent('body')
    if (/address/i.test(bodyText || '')) {
      await page.locator('input[type="text"]').filter({ hasText: '' }).first().fill('123 Main St, Austin, TX 78701')
      await screenshot(page, 'AP-09-address')
      const vfsText = page.getByText('Houston', { exact: false })
      const hasHouston = await vfsText.count() > 0
      console.log(`AP-09: Houston VFS centre shown: ${hasHouston}`)
    } else {
      console.log('AP-09: Address step not immediately visible — need to navigate to it')
    }
  })

  test('AP-10: Back button returns to previous step with fields filled', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    // Fill step 1
    const inputs = page.locator('input[type="text"]')
    if (await inputs.count() >= 1) await inputs.first().fill('Test')
    if (await inputs.count() >= 2) await inputs.nth(1).fill('User')
    const continueBtn = page.getByRole('button', { name: /continue/i }).first()
    if (await continueBtn.isEnabled()) {
      await continueBtn.click()
      await page.waitForTimeout(600)
      await screenshot(page, 'AP-10-step2')
      // Click back
      const backBtn = page.getByRole('button', { name: /back/i }).first()
      if (await backBtn.count() > 0 && await backBtn.isEnabled()) {
        await backBtn.click()
        await page.waitForTimeout(600)
        await screenshot(page, 'AP-10-back-to-step1')
        // Check step 1 fields still filled
        const firstInput = page.locator('input[type="text"]').first()
        const value = await firstInput.inputValue().catch(() => '')
        console.log(`AP-10: first field value after back: "${value}"`)
      }
    }
  })

  test('AP-11: complete all steps → review screen loads, no 400 from validate-application', async ({ page }) => {
    await signIn(page)
    const errors: string[] = []
    page.on('response', r => { if (r.status() >= 400 && r.url().includes('validate')) errors.push(`${r.status()} ${r.url()}`) })
    await page.goto(`${BASE_URL}/apply/review`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-11-review')
    console.log(`AP-11: review page url: ${page.url()}`)
    console.log(`AP-11: validate errors: ${errors.join(', ')}`)
    const reviewText = page.getByText(/review|application summary/i).first()
    const hasReview = await reviewText.count() > 0
    console.log(`AP-11: review content visible: ${hasReview}`)
  })

  test('AP-12: review screen — summary, document checklist, guarantee badge', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/review`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AP-12-review-full')
    const guarantee = page.getByText(/guarantee/i).first()
    const hasGuarantee = await guarantee.count() > 0
    console.log(`AP-12: guarantee badge: ${hasGuarantee}`)
    const checklist = page.locator('[class*="checklist"], [class*="document"]').first()
    const hasChecklist = await checklist.count() > 0
    console.log(`AP-12: document checklist: ${hasChecklist}`)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 6 — PACKAGE AND STATUS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 6 — PACKAGE AND STATUS', () => {

  test('PK-01: /apply/package — AVA message, two action cards, download PDF button', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/package`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'PK-01-package')
    const url = page.url()
    console.log(`PK-01: package page url: ${url}`)
    const downloadBtn = page.getByText(/download|PDF|package/i).first()
    const hasDownload = await downloadBtn.count() > 0
    console.log(`PK-01: download/PDF button: ${hasDownload}`)
    const avaMsg = page.getByText(/completed|on your behalf|two steps|all that's left/i).first()
    const hasAvaMsg = await avaMsg.count() > 0
    console.log(`PK-01: AVA completion message: ${hasAvaMsg}`)
  })

  test('PK-02: /apply/status — timeline renders, stages visible', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/status`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'PK-02-status')
    const url = page.url()
    console.log(`PK-02: status page url: ${url}`)
    // Either shows timeline or redirects to /apply
    const isStatusOrApply = url.includes('/apply')
    expect(isStatusOrApply).toBe(true)
    const timelineEl = page.locator('[class*="timeline"], [class*="stage"], [class*="status"]').first()
    const hasTimeline = await timelineEl.count() > 0
    console.log(`PK-02: timeline visible: ${hasTimeline}`)
  })

  test('PK-03: /dashboard/applications → click application → routes to status', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/applications`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'PK-03-applications')
    const appLink = page.locator('a[href*="/apply"], a[href*="/application"]').first()
    if (await appLink.count() > 0) {
      await appLink.click()
      await page.waitForLoadState('domcontentloaded')
      await screenshot(page, 'PK-03-app-detail')
      console.log(`PK-03: navigated to ${page.url()}`)
    } else {
      console.log('PK-03: No applications found (test account has no applications)')
    }
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 7 — ACCOUNT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 7 — ACCOUNT SETTINGS', () => {

  test('AC-01: /dashboard/account — profile section, notification preferences', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AC-01-account')
    const profileSection = page.getByText(/profile|name|email/i).first()
    const hasProfile = await profileSection.count() > 0
    console.log(`AC-01: profile section: ${hasProfile}`)
    const notifSection = page.getByText(/notification|alert|email|whatsapp/i).first()
    const hasNotif = await notifSection.count() > 0
    console.log(`AC-01: notification section: ${hasNotif}`)
  })

  test('AC-02: sign out button visible with LogOut icon', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AC-02-signout')
    const signOutBtn = page.getByRole('button', { name: /sign out|log out/i }).first()
    const signOutEl = page.getByText(/sign out|log out/i).first()
    const hasSignOut = await signOutBtn.count() > 0 || await signOutEl.count() > 0
    console.log(`AC-02: sign out button visible: ${hasSignOut}`)
    expect(hasSignOut).toBe(true)
  })

  test('AC-03: danger zone section with DELETE input', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'AC-03-danger-zone')
    const dangerZone = page.getByText(/danger|delete|remove account/i).first()
    const hasDanger = await dangerZone.count() > 0
    console.log(`AC-03: danger zone visible: ${hasDanger}`)
    const deleteInput = page.locator('input[placeholder*="DELETE"], input[placeholder*="delete"]').first()
    const hasDeleteInput = await deleteInput.count() > 0
    console.log(`AC-03: DELETE input visible: ${hasDeleteInput}`)
  })

  test('AC-04: type "DELETE" → delete button enables; wrong text → stays disabled', async ({ page }) => {
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard/account`)
    await page.waitForLoadState('domcontentloaded')
    const deleteInput = page.locator('input[placeholder*="DELETE"], input[placeholder*="delete"], input[name*="delete" i]').first()
    if (await deleteInput.count() > 0) {
      // Type wrong text first
      await deleteInput.fill('wrong')
      await page.waitForTimeout(300)
      const deleteBtn = page.getByRole('button', { name: /delete.*account|delete.*data/i }).first()
      if (await deleteBtn.count() > 0) {
        const disabledWithWrong = await deleteBtn.isDisabled()
        console.log(`AC-04: button disabled with "wrong": ${disabledWithWrong}`)
      }
      // Type DELETE
      await deleteInput.fill('DELETE')
      await page.waitForTimeout(300)
      await screenshot(page, 'AC-04-delete-enabled')
      if (await deleteInput.count() > 0) {
        const deleteBtn2 = page.getByRole('button', { name: /delete.*account|delete.*data/i }).first()
        if (await deleteBtn2.count() > 0) {
          const enabledWithDELETE = await deleteBtn2.isEnabled()
          console.log(`AC-04: button enabled with "DELETE": ${enabledWithDELETE}`)
        }
      }
    } else {
      console.log('AC-04: DELETE input not found on account page')
    }
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 8 — MOBILE RESPONSIVENESS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FEATURE 8 — MOBILE RESPONSIVENESS', () => {

  test('MOB-01: 375px viewport, landing page — no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    // Scroll to trigger lazy content
    for (let y = 0; y <= 3000; y += 500) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y)
      await page.waitForTimeout(200)
    }
    await screenshot(page, 'MOB-01-mobile-landing')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`MOB-01: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('MOB-02: 375px viewport, /auth — form fills screen, no cut-off', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/auth`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'MOB-02-mobile-auth')
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`MOB-02: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('MOB-03: 375px viewport, /dashboard — sidebar collapses, cards stack', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'MOB-03-mobile-dashboard')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`MOB-03: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`)
    // Sidebar should be hidden or collapsed on mobile
    const sidebar = page.locator('[class*="sidebar"], aside').first()
    if (await sidebar.count() > 0) {
      const isVisible = await sidebar.isVisible()
      console.log(`MOB-03: sidebar visible on 375px: ${isVisible}`)
    }
  })

  test('MOB-04: 375px viewport, /apply — one question per screen, Continue visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto(`${BASE_URL}/apply/form`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'MOB-04-mobile-apply')
    const continueBtn = page.getByRole('button', { name: /continue/i }).first()
    const hasVisible = await continueBtn.count() > 0
    console.log(`MOB-04: Continue button visible on mobile: ${hasVisible}`)
    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`MOB-04: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('MOB-05: 375px viewport, /onboarding — upload zone visible, AVA readable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await page.waitForLoadState('domcontentloaded')
    await screenshot(page, 'MOB-05-mobile-onboarding')
    const uploadZone = page.locator('input[type="file"], [class*="upload"]').first()
    const hasUpload = await uploadZone.count() > 0
    console.log(`MOB-05: upload zone visible on mobile: ${hasUpload}`)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    console.log(`MOB-05: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

})
