import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAvailableServices } from '@/lib/services/registry'
import { fetchRequirements } from '@/lib/requirements-engine'
import type { RequirementsResult, RequirementItem } from '@/lib/requirements-engine'
import DashboardShell from '@/components/DashboardShell'
import { CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default async function RequirementsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const services = getAvailableServices()
  const adminSupabase = createServiceClient()

  // Fetch requirements for all available services in parallel
  const results = await Promise.allSettled(
    services.map(s => fetchRequirements(s, adminSupabase))
  )

  const serviceRequirements: { service: ReturnType<typeof getAvailableServices>[number]; data: RequirementsResult }[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      serviceRequirements.push({ service: services[i], data: result.value })
    }
  })

  return (
    <DashboardShell activePage="applications" pageTitle="Current Requirements">
      <div style={{ maxWidth: 720 }}>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          AVA monitors official requirements daily. You&apos;ll be notified if anything changes before you submit.
        </p>

        {serviceRequirements.map(({ service, data }) => (
          <div key={service.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>
                  {service.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)' }}>
                  <RefreshCw size={12} />
                  <span style={{ fontSize: 12 }}>
                    Last checked: {new Date(data.fetched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {data.changed_from_previous && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: 'var(--warning-bg)', border: '1px solid #F59E0B', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                  Recently updated
                </span>
              )}
            </div>

            {/* Processing time + fees row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} color="var(--text-tertiary)" />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 1 }}>Processing</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{data.processing_time}</p>
                </div>
              </div>
              {data.fees.map(fee => (
                <div key={fee.label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} color="var(--text-tertiary)" />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 1 }}>{fee.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>${fee.amount_usd}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Requirements grouped by category */}
            <RequirementsList requirements={data.requirements} />

            {/* Source links */}
            {data.source_urls.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Official sources:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.source_urls.map(url => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Link href={`/apply/prepare/${service.id}`}
              style={{ display: 'block', marginTop: 16, textAlign: 'center', background: 'var(--navy)', color: 'white', borderRadius: 10, padding: '12px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Start {service.short_name} application →
            </Link>
          </div>
        ))}

      </div>
    </DashboardShell>
  )
}

function RequirementsList({ requirements }: { requirements: RequirementItem[] }) {
  // Group by category
  const grouped: Record<string, RequirementItem[]> = {}
  for (const req of requirements) {
    if (!grouped[req.category]) grouped[req.category] = []
    grouped[req.category].push(req)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            {category}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                <CheckCircle size={15} color={item.mandatory ? 'var(--success)' : 'var(--text-tertiary)'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: item.notes ? 2 : 0 }}>{item.item}</p>
                  {item.notes && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.notes}</p>}
                </div>
                {!item.mandatory && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', flexShrink: 0 }}>optional</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
