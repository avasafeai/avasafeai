import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
}

const sizes = {
  sm: '20px',
  md: '24px',
  lg: '32px',
}

export default function Logo({ size = 'md', className = '', href = '/' }: LogoProps) {
  const fontSize = sizes[size]

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} className={className}>
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
        <span style={{ color: 'var(--navy)' }}>ava</span>
        <span style={{ color: 'var(--gold)' }}>safe</span>
      </span>
    </Link>
  )
}
