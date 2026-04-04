'use client'

import { useEffect, useRef } from 'react'

interface ReadinessRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

function ringColor(score: number): string {
  if (score >= 90) return '#27500A'
  if (score >= 70) return '#C9882A'
  return '#A32D2D'
}

function ringLabel(score: number): string {
  if (score >= 90) return 'Ready to submit'
  if (score >= 70) return 'Fix issues below'
  return 'Review required'
}

export default function ReadinessRing({ score, size = 120, strokeWidth = 8 }: ReadinessRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progressRef = useRef<SVGCircleElement>(null)
  const color = ringColor(score)

  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    // Start at 0 and animate to final
    el.style.strokeDashoffset = String(circumference)
    const target = circumference * (1 - score / 100)
    // Slight delay so the ring draws visibly
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)'
      el.style.strokeDashoffset = String(target)
    })
    return () => cancelAnimationFrame(raf)
  }, [score, circumference])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            ref={progressRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <span style={{ fontSize: 32, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-body)' }}>{score}</span>
            <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>%</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>readiness</span>
        </div>
      </div>
      {/* Status badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: score >= 90 ? 'rgba(39,80,10,0.1)' : score >= 70 ? 'rgba(201,136,42,0.12)' : 'rgba(163,45,45,0.1)',
        color: color,
        fontFamily: 'var(--font-body)',
      }}>
        {ringLabel(score)}
      </span>
    </div>
  )
}
