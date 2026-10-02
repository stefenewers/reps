'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { parseChallenge } from '@/lib/coach/challenge'
import { getAnotherRep, requestPlan } from '@/lib/coach/client'
import { buildSkillSession, createSession } from '@/lib/sessions'
import { weakestSkills } from '@/lib/progress'
import { skillName } from '@/data/skills'

/**
 * Challenge me: free text → bounded practice on existing skills. Parsed locally
 * when possible (no tokens); the model is asked only for open-ended requests,
 * and fresh generation only when the request asks for new problems.
 */
export default function ChallengeMe({ dark = false }: { dark?: boolean }) {
  const router = useRouter()
  const { repo, mastery, attempts, today } = useReps()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const go = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setMsg(null)
    try {
      const weakest = weakestSkills(mastery, 5).map((m) => m.skillId)
      let plan = parseChallenge(text, weakest)
      if (!plan) plan = await requestPlan({ request: text, weakest })
      if (!plan.skills.length) plan = { ...plan, skills: weakest }
      if (!plan.skills.length) {
        setMsg('Do a few reps first so Reps knows your weakest skills.')
        return
      }
      const ids = buildSkillSession(plan.skills, attempts, today, plan.count)
      if (plan.fresh) {
        setMsg('Generating a fresh rep and checking it runs…')
        const { exercise } = await getAnotherRep(repo, mastery, {
          skills: plan.skills,
          type: plan.type,
          difficulty: plan.difficulty,
          hidePattern: plan.hidePattern,
          count: 2,
        })
        ids.unshift(exercise.id)
      }
      if (!ids.length) {
        setMsg(`No reps yet for ${plan.skills.map(skillName).join(', ')} up to today.`)
        return
      }
      const s = await createSession(repo, 'challenge', `Challenge · ${plan.skills.map(skillName).slice(0, 3).join(', ')}`, ids.slice(0, plan.count))
      router.push(`/rep/${s.exerciseIds[0]}?s=${s.id}`)
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={go} className="flex flex-col gap-2">
      <label htmlFor="challenge" className={`flex items-center gap-2 text-[15px] font-semibold tracking-tight ${dark ? 'text-white' : ''}`}>
        Challenge me
        <span className={`text-[12px] font-normal ${dark ? 'text-white/50' : 'text-faint'}`}>Ask for reps in plain words</span>
      </label>
      <div className="flex gap-2">
        <input
          id="challenge"
          className={`input ${dark ? '!bg-white/10 !text-white !shadow-[0_0_0_1px_rgba(255,255,255,0.14)] placeholder:!text-white/40 focus:!shadow-[0_0_0_1px_rgba(255,255,255,0.4)]' : ''}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I keep forgetting .get(). Give me reps."
          autoComplete="off"
        />
        <button type="submit" className={`btn shrink-0 ${dark ? '!bg-white !text-ink' : ''}`} disabled={busy || !text.trim()}>
          {busy ? 'Building…' : 'Go'}
        </button>
      </div>
      <p className={`text-[12px] ${dark ? 'text-white/50' : 'text-faint'}`} aria-live="polite">
        {msg ?? 'Try: “10 fast dictionary + enumerate questions” · “I have 20 minutes. Hit my weakest skills.”'}
      </p>
    </form>
  )
}
