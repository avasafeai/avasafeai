interface AvaMessageProps {
  message: string
  className?: string
}

export default function AvaMessage({ message, className = '' }: AvaMessageProps) {
  return (
    <div
      className={`flex gap-3 ${className}`}
      style={{
        borderLeft: '2px solid var(--gold)',
        paddingLeft: 16,
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 12,
            color: 'white',
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 16,
          lineHeight: 1.65,
          color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  )
}
