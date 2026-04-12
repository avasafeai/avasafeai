'use client'

import { toast } from '@/lib/toast'

interface Props {
  email: string
  label?: string
  style?: React.CSSProperties
}

export default function CopyEmailButton({ email, label, style }: Props) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    navigator.clipboard.writeText(email).then(() => {
      toast.success('Email copied to clipboard')
    }).catch(() => {
      toast.info(`Email: ${email}`)
    })
  }

  return (
    <button
      onClick={handleClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'var(--gold)',
        textDecoration: 'none',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {label ?? email}
    </button>
  )
}
