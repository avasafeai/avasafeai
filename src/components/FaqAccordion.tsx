'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-0">
      {items.map((item, i) => (
        <div
          key={i}
          className="py-5 cursor-pointer"
          style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-medium text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {item.q}
            </h3>
            <ChevronDown
              size={16}
              className="flex-shrink-0 mt-0.5 transition-transform duration-200"
              style={{
                color: 'var(--color-text-tertiary)',
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
          {open === i && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
