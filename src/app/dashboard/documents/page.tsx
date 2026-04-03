import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import DocumentCardList from './DocumentCardList'
import { FileText, Plus } from 'lucide-react'

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: docs } = await supabase
    .from('documents')
    .select('id, doc_type, expires_at, created_at, extracted_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const addBtn = (
    <Link href="/dashboard/documents/add" className="btn-navy" style={{ height: 40, padding: '0 16px', fontSize: 14 }}>
      <Plus size={15} /> Add document
    </Link>
  )

  const docsWithTypedData = (docs ?? []).map(d => ({
    ...d,
    extracted_data: d.extracted_data as Record<string, string> | null,
  }))

  return (
    <DashboardShell activePage="documents" pageTitle="My Documents" topBarActions={addBtn}>
      {docsWithTypedData.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <FileText size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>
            Your locker is empty
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 380 }}>
            Add your passport and OCI card so AVA can monitor expiry dates and pre-fill every future application.
          </p>
          <Link href="/dashboard/documents/add" className="btn-navy">
            <Plus size={16} /> Add your first document
          </Link>
        </div>
      ) : (
        <>
          <DocumentCardList docs={docsWithTypedData} />

          {/* Add card — separate from the interactive list */}
          <div style={{ marginTop: 16 }}>
            <Link href="/dashboard/documents/add"
              className="hover:border-[var(--gold)] transition-colors duration-200"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', border: '2px dashed var(--border)', borderRadius: 16, padding: 24, minHeight: 148, textDecoration: 'none', maxWidth: 240 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="var(--text-tertiary)" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>Add document</span>
            </Link>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
