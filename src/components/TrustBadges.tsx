import { Lock, Shield, Star } from 'lucide-react'

export default function TrustBadges() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
      {[
        { icon: Lock, label: 'Bank-level encryption' },
        { icon: Shield, label: 'No human sees your documents' },
        { icon: Star, label: 'Rejection guarantee' },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={14} style={{ color: 'var(--color-navy)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
