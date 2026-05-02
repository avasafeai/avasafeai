import Link from 'next/link'
import { BETA_MODE } from '@/lib/beta'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
  onDark?: boolean
}

const sizes = {
  sm: '20px',
  md: '24px',
  lg: '32px',
}

export default function Logo({ size = 'md', className = '', href = '/', onDark = false }: LogoProps) {
  const fontSize = sizes[size]

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }} className={className}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 0,
        }}
      >
        <span style={{ color: onDark ? '#ffffff' : 'var(--navy)' }}>ava</span>
        <span style={{ color: 'var(--gold)' }}>safe</span>
      </span>
      {BETA_MODE && (
        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Beta
        </span>
      )}
    </Link>
  )
}
