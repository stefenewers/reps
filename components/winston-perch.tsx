'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './winston-ambient.css'

/**
 * Winston, standing in the page instead of floating over it. He idles on a
 * ground line and now and then strolls a little way along it. Visual only:
 * no text, no clicks, no knowledge of progress. While a perch is on screen the
 * corner Winston stays away, so there is only ever one of him.
 */
/** A small pixel prop, drawn on the same 2px grid as the sprite. Decoration only. */
function Prop({ kind }: { kind: 'dumbbell' | 'clipboard' | 'zzz' }) {
  if (kind === 'zzz')
    return (
      <svg className="wa-prop wa-prop--zzz" width="22" height="18" viewBox="0 0 11 9" shapeRendering="crispEdges">
        <path d="M0 5h3v1H1v1h1v1H0zM5 1h4v1H8v1H7v1H6v1h3v1H5V5h1V4h1V3h1V2H5z" fill="var(--rest)" />
      </svg>
    )
  if (kind === 'clipboard')
    return (
      <svg className="wa-prop wa-prop--hand" width="14" height="18" viewBox="0 0 7 9" shapeRendering="crispEdges">
        <path d="M0 1h7v8H0z" fill="#8a6a3b" />
        <path d="M1 2h5v6H1z" fill="#f6f1e6" />
        <path d="M2 0h3v2H2z" fill="#56606e" />
        <path d="M2 4h3v1H2zM2 6h2v1H2z" fill="var(--repair)" />
      </svg>
    )
  return (
    <svg className="wa-prop wa-prop--hand" width="22" height="10" viewBox="0 0 11 5" shapeRendering="crispEdges">
      <path d="M0 0h2v5H0zM9 0h2v5H9z" fill="#2b3446" />
      <path d="M2 1h1v3H2zM8 1h1v3H8z" fill="#4a5568" />
      <path d="M3 2h5v1H3z" fill="#8b94a3" />
    </svg>
  )
}

export default function WinstonPerch({
  className = '',
  mood = 'awake',
  ground = true,
  prop
}: {
  className?: string
  mood?: 'rest' | 'awake' | 'celebrate'
  ground?: boolean
  prop?: 'dumbbell' | 'clipboard' | 'zzz'
}) {
  const host = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [walking, setWalking] = useState(false)
  const [walkMs, setWalkMs] = useState(0)
  const [facing, setFacing] = useState<1 | -1>(1)
  const xRef = useRef(0)

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined
    let stop: number | undefined
    const stroll = () => {
      timer = window.setTimeout(
        () => {
          const w = host.current?.clientWidth ?? 0
          if (mood !== 'rest' && !still.matches && document.visibilityState === 'visible' && w > 120) {
            const max = w - 64
            const target = Math.round(Math.max(0, Math.min(max, xRef.current + (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 220))))
            const distance = target - xRef.current
            const ms = Math.max(700, (Math.abs(distance) / 55) * 1000)
            setFacing(distance >= 0 ? 1 : -1)
            setWalkMs(ms)
            setWalking(true)
            xRef.current = target
            setX(target)
            stop = window.setTimeout(() => setWalking(false), ms)
          }
          stroll()
        },
        6000 + Math.random() * 12000
      )
    }
    stroll()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(stop)
    }
  }, [mood])

  return (
    <div ref={host} data-winston-perch="" data-mood={mood} aria-hidden="true" className={`relative h-16 ${className}`}>
      {ground && <span className="absolute inset-x-0 bottom-[3px] h-px bg-line" />}
      <div className="wa-perch" style={{ transform: `translateX(${x}px)`, '--walk-ms': `${walkMs}ms` } as CSSProperties}>
        <span className={`wa-sprite ${walking ? 'wa-sprite--walk' : 'wa-sprite--idle'}`} style={{ '--face': facing } as CSSProperties} />
        {prop && !walking && <Prop kind={prop} />}
      </div>
    </div>
  )
}
