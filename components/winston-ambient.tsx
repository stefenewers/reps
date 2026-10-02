'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './winston-ambient.css'

/**
 * Winston, as an ambient presence. He idles near the bottom-right edge and now
 * and then walks a short way and back. That is all he does: no text, no
 * clicks, no API, no awareness of progress. Under reduced motion he stands
 * still.
 */

const SIZE = 64
const EDGE = 20
const SPEED = 60 // px per second, an unhurried stroll
const RANGE = 140 // how far from home he wanders

export default function WinstonAmbient() {
  const [x, setX] = useState<number | null>(null)
  const [walking, setWalking] = useState(false)
  const [walkMs, setWalkMs] = useState(0)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const xRef = useRef(0)

  useEffect(() => {
    const home = () => window.innerWidth - SIZE - EDGE
    xRef.current = home()
    setX(xRef.current)

    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined
    let stop: number | undefined

    const wander = () => {
      timer = window.setTimeout(
        () => {
          if (!still.matches && document.visibilityState === 'visible') {
            const h = home()
            const target = Math.max(EDGE, h - Math.random() * RANGE)
            const next = Math.abs(xRef.current - h) > 8 ? h : target // out, then back home
            const distance = next - xRef.current
            const ms = Math.max(600, (Math.abs(distance) / SPEED) * 1000)
            setFacing(distance > 0 ? 1 : -1)
            setWalkMs(ms)
            setWalking(true)
            xRef.current = next
            setX(next)
            stop = window.setTimeout(() => setWalking(false), ms)
          }
          wander()
        },
        14_000 + Math.random() * 22_000,
      )
    }
    wander()

    const onResize = () => {
      xRef.current = home()
      setWalkMs(0)
      setX(xRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(stop)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (x === null) return null
  return (
    <div className="wa" aria-hidden="true" style={{ left: x, '--walk-ms': `${walkMs}ms` } as CSSProperties}>
      <span className={`wa-sprite ${walking ? 'wa-sprite--walk' : 'wa-sprite--idle'}`} style={{ '--face': facing } as CSSProperties} />
    </div>
  )
}
