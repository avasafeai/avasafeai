import { config } from 'dotenv'
import path from 'path'

// Load .env.local from project root
config({ path: path.resolve(__dirname, '..', '.env.local') })

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[global-setup] Supabase env vars not found — skipping plan setup')
    return
  }

  // Dynamically import to avoid bundling issues
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: 'test@avasafe.ai',
    password: 'TestAvasafe2026!',
  })

  if (error || !user) {
    console.log(`[global-setup] Could not sign in as test user: ${error?.message ?? 'unknown'}`)
    return
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, plan: 'apply' }, { onConflict: 'id' })

  if (upsertError) {
    console.log(`[global-setup] Could not set plan: ${upsertError.message}`)
  } else {
    console.log(`[global-setup] Set plan='apply' for test@avasafe.ai (${user.id})`)
  }

  await supabase.auth.signOut()
}
