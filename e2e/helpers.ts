import { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

export const BASE_URL = 'http://localhost:3000'

// Test user credentials — created fresh each run via Supabase admin
export const TEST_EMAIL = `test+${Date.now()}@avasafe-test.com`
export const TEST_PASSWORD = 'TestPass123!'
export const TEST_NAME = 'Priya Sharma'

/**
 * Sign up a test user directly via Supabase admin client (bypasses email verification).
 * Returns the user id.
 */
export async function createTestUser(): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    user_metadata: { full_name: TEST_NAME },
    email_confirm: true,
  })
  if (error) throw new Error(`createTestUser failed: ${error.message}`)
  return data.user.id
}

/**
 * Delete test user by id.
 */
export async function deleteTestUser(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  await supabase.auth.admin.deleteUser(id)
}

/**
 * Sign in through the UI auth form.
 */
export async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}
