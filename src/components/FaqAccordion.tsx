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
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            style={{
              borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
              background: isOpen ? 'rgba(201,136,42,0.04)' : 'transparent',
              borderLeft: isOpen ? '3px solid var(--color-gold, #C9882A)' : '3px solid transparent',
              transition: 'background 150ms ease, border-color 150ms ease',
              paddingLeft: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '20px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <h3
                className="font-medium text-sm leading-relaxed"
                style={{ color: isOpen ? 'var(--color-navy, #0F2D52)' : 'var(--color-text-primary)', margin: 0 }}
              >
                {item.q}
              </h3>
              <ChevronDown
                size={16}
                className="flex-shrink-0 mt-0.5"
                style={{
                  color: 'var(--color-text-tertiary)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  flexShrink: 0,
                }}
              />
            </button>
            {isOpen && (
              <div
                id={`faq-answer-${i}`}
                role="region"
                style={{ paddingBottom: 20 }}
              >
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                  {item.a}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
