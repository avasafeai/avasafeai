interface AvaMessageProps {
  message: string
  className?: string
}

export default function AvaMessage({ message, className = '' }: AvaMessageProps) {
  return (
    <div
      className={`flex gap-3 items-start ${className}`}
      style={{
        background: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-navy)',
        borderRadius: '10px',
        padding: '16px 20px',
      }}
    >
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          width: 28,
          height: 28,
          background: 'var(--color-navy)',
          color: 'white',
          fontFamily: 'var(--font-body)',
        }}
      >
        A
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-text-primary)' }}
      >
        {message}
      </p>
    </div>
  )
}
