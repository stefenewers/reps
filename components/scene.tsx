/**
 * The Reps landscape: layered ridges, a pine line and the sky, drawn as one
 * small SVG. Its palette is the day's state, so the hero says "train", "done",
 * "rest" or "repair" before a word is read. Decorative only (aria-hidden).
 */

export type Mood = 'dawn' | 'golden' | 'dusk' | 'repair' | 'cold' | 'night'

interface Palette {
  sky: [string, string, string]
  sun: string
  glow: string
  ridges: [string, string, string, string]
  snow: string
  pines: string
  stars?: boolean
  moon?: boolean
}

const PALETTES: Record<Mood, Palette> = {
  // A training morning: cool blue light, a low sun behind the far range.
  dawn: { sky: ['#cfe0f3', '#e9eff5', '#f8efe2'], sun: '#ffe7c2', glow: 'rgba(255,214,160,0.55)', ridges: ['#b9c9dc', '#8ea5bf', '#5d7894', '#2f4a64'], snow: '#f3f6fa', pines: '#1d3247' },
  // The day is done: warm low light.
  golden: { sky: ['#f6c98f', '#f9dcb4', '#fcefd9'], sun: '#fff1cf', glow: 'rgba(255,190,110,0.7)', ridges: ['#e1b18b', '#c48c6c', '#8f6352', '#4d3a35'], snow: '#fff3e2', pines: '#33272a' },
  // Planned rest: evening, a moon, nothing asked.
  dusk: { sky: ['#2b3555', '#545c80', '#a68fa3'], sun: '#f7eedb', glow: 'rgba(240,220,200,0.25)', ridges: ['#7a7895', '#5b5d7c', '#3f4563', '#252c44'], snow: '#cfd2e2', pines: '#171d30', stars: true, moon: true },
  // Repair: overcast, steady, nothing alarming.
  repair: { sky: ['#d9d4c8', '#e8e3d7', '#f3eadb'], sun: '#fbe9c8', glow: 'rgba(230,180,110,0.35)', ridges: ['#c3bba9', '#a19784', '#776d5c', '#4a4338'], snow: '#f4f0e7', pines: '#2e2a24' },
  // Prove it cold: crisp, high, blue-violet.
  cold: { sky: ['#cfd3f2', '#e4e6f7', '#f2f2fa'], sun: '#ffffff', glow: 'rgba(200,205,255,0.5)', ridges: ['#b6bbe0', '#8c90c4', '#5d5f99', '#2f3063'], snow: '#ffffff', pines: '#1f2048' },
  // Interview: the scaffolding is gone.
  night: { sky: ['#0b1220', '#141d30', '#1d2940'], sun: '#dfe6f2', glow: 'rgba(160,180,220,0.18)', ridges: ['#2a3550', '#212b42', '#182034', '#0f1626'], snow: '#56637e', pines: '#0a0f1b', stars: true }
}

/** A deterministic ridge line: sums of sines, so every render is identical (no hydration drift). */
function ridge(w: number, base: number, amp: number, seed: number, step = 24): string {
  let d = `M0 ${base}`
  for (let x = 0; x <= w; x += step) {
    const y = base - amp * (0.55 * Math.sin(x / 140 + seed) + 0.3 * Math.sin(x / 57 + seed * 2.1) + 0.15 * Math.sin(x / 23 + seed * 3.7))
    d += ` L${x} ${y.toFixed(1)}`
  }
  return `${d} L${w} 400 L0 400 Z`
}

/** Snow on the highest ridge: the same line, clipped to its peaks. */
function peaks(w: number, base: number, amp: number, seed: number): string {
  const pts: string[] = []
  for (let x = 0; x <= w; x += 12) {
    const y = base - amp * (0.55 * Math.sin(x / 140 + seed) + 0.3 * Math.sin(x / 57 + seed * 2.1) + 0.15 * Math.sin(x / 23 + seed * 3.7))
    pts.push(`${x} ${y.toFixed(1)}`)
  }
  return `M${pts.join(' L')}`
}

function pines(w: number, base: number, seed: number): string {
  let d = ''
  for (let i = 0; i < w / 11; i++) {
    const x = i * 11 + 5 * Math.sin(i * 1.7 + seed)
    const h = 18 + 14 * Math.abs(Math.sin(i * 0.73 + seed)) + 10 * Math.abs(Math.sin(i * 0.19))
    const y = base + 6 * Math.sin(i * 0.31 + seed)
    d += `M${x.toFixed(1)} ${(y - h).toFixed(1)} L${(x + h * 0.26).toFixed(1)} ${y.toFixed(1)} L${(x - h * 0.26).toFixed(1)} ${y.toFixed(1)} Z `
  }
  return `${d}M0 ${base + 4} H${w} V400 H0 Z`
}

const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 211) % 1200, y: (i * 97) % 170, r: i % 5 === 0 ? 1.4 : 0.8 }))

export default function Scene({ mood = 'dawn', className = '', pinesOn = true }: { mood?: Mood; className?: string; pinesOn?: boolean }) {
  const p = PALETTES[mood]
  const id = `scene-${mood}`
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className} data-mood={mood}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.6" stopColor={p.sky[1]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.72" cy="0.5" r="0.45">
          <stop offset="0" stopColor={p.glow} />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="1" stopColor={p.sky[2]} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill={`url(#${id}-sky)`} />
      <rect width="1200" height="400" fill={`url(#${id}-glow)`} />
      {p.stars && STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.35 + (i % 3) * 0.2} />)}
      {p.moon ? (
        <g transform="translate(905 150)">
          <circle r="26" fill={p.sun} />
          <circle cx="11" cy="-7" r="23" fill={p.sky[0]} />
        </g>
      ) : (
        <circle cx="865" cy="215" r="46" fill={p.sun} opacity="0.9" />
      )}
      <path d={ridge(1200, 215, 95, 1.3)} fill={p.ridges[0]} />
      <path d={peaks(1200, 215, 95, 1.3)} fill="none" stroke={p.snow} strokeWidth="2.5" strokeLinejoin="round" opacity="0.7" />
      <rect y="150" width="1200" height="250" fill={`url(#${id}-haze)`} />
      <path d={ridge(1200, 262, 70, 4.2, 20)} fill={p.ridges[1]} />
      <path d={ridge(1200, 300, 46, 2.6, 16)} fill={p.ridges[2]} />
      {pinesOn ? <path d={pines(1200, 352, 0.8)} fill={p.pines} /> : <path d={ridge(1200, 345, 18, 5.1, 16)} fill={p.ridges[3]} />}
    </svg>
  )
}
