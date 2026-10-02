'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './winston-ambient.css'

/**
 * Winston, standing in the page instead of floating over it. He idles on a
 * ground line and now and then strolls a little way along it. Visual only:
 * no text, no clicks, no knowledge of progress. While a perch is on screen the
 * corner Winston stays away, so there is only ever one of him.
 */
export default function WinstonPerch({ className = '' }: { className?: string }) {
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
          if (!still.matches && document.visibilityState === 'visible' && w > 120) {
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
        6000 + Math.random() * 12000,
      )
    }
    stroll()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(stop)
    }
  }, [])

  return (
    <div ref={host} data-winston-perch="" aria-hidden="true" className={`relative h-16 ${className}`}>
      <span className="absolute inset-x-0 bottom-[3px] h-px bg-line" />
      <div className="wa-perch" style={{ transform: `translateX(${x}px)`, '--walk-ms': `${walkMs}ms` } as CSSProperties}>
        <span className={`wa-sprite ${walking ? 'wa-sprite--walk' : 'wa-sprite--idle'}`} style={{ '--face': facing } as CSSProperties} />
      </div>
    </div>
  )
}
