interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <span
      className={`font-display font-bold tracking-tight inline-flex items-center gap-0.5 ${sizeClasses[size]} ${className}`}
      style={{ color: 'var(--color-navy)' }}
    >
      <span>ava</span>
      <span style={{ color: 'var(--color-gold)' }}>safe</span>
    </span>
  )
}
