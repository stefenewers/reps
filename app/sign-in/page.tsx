'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { getSupabase, supabaseConfigured } from '@/lib/supabase'

/**
 * Private sign-in to an existing account only: password, or a magic link with
 * shouldCreateUser: false. Nobody can create an account here. Reps data is
 * further limited to accounts listed in reps_owners by Row Level Security.
 */
export default function SignInPage() {
  const { userEmail, status, pending, syncError } = useReps()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [who, setWho] = useState<{ id: string; owner: string } | null>(null)

  // Diagnostics: which account this session is, and whether the database treats it as the Reps owner.
  useEffect(() => {
    const sb = getSupabase()
    if (!sb || !userEmail) return
    void (async () => {
      const { data } = await sb.auth.getUser()
      const { data: owner, error } = await sb.rpc('reps_is_owner')
      setWho({ id: data.user?.id ?? 'unknown', owner: error ? `error: ${error.message}` : owner ? 'yes' : 'no' })
    })()
  }, [userEmail])

  if (!supabaseConfigured()) {
    return (
      <Shell>
        <p className="text-[14px] text-muted">
          Sync is not configured. Reps is saving locally on this device. Add <code className="mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to enable durable progress.
        </p>
      </Shell>
    )
  }

  if (userEmail) {
    return (
      <Shell>
        <p className="text-[14px] text-ink-2">Signed in as {userEmail}.</p>
        <p className="mt-1 text-[13px] text-muted">
          Sync: {status}
          {pending ? ` · ${pending} pending` : ''}
        </p>
        {who && (
          <p className="mono mt-3 text-[12px] text-muted">
            user id {who.id} · Reps owner: {who.owner}
          </p>
        )}
        {syncError && (
          <p className="mono mt-3 whitespace-pre-wrap rounded-md bg-warn-soft px-3 py-2 text-[12px] text-warn" role="status">
            {syncError}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Link href="/" className="btn btn-primary">
            Back to Today
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => void getSupabase()?.auth.signOut()}>
            Sign out
          </button>
        </div>
      </Shell>
    )
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    setError(null)
    const auth = getSupabase()!.auth
    const { error } = password
      ? await auth.signInWithPassword({ email: email.trim(), password })
      : await auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } })
    if (error) {
      setState('error')
      setError(error.message)
    } else setState(password ? 'idle' : 'sent')
  }

  return (
    <Shell>
      <p className="text-[14px] text-muted">Progress is already saved on this device. Sign in to keep it durable and use it on other devices.</p>
      {state === 'sent' ? (
        <p className="mt-6 text-[14px] text-ink-2" role="status">
          Check your email for the sign-in link.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 flex flex-col gap-3">
          <label htmlFor="email" className="text-[13px] text-muted">
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" className="text-[13px] text-muted">
            Password <span className="text-faint">(leave empty to get an email link instead)</span>
          </label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary self-start" disabled={state === 'sending'}>
            {state === 'sending' ? 'Signing in…' : password ? 'Sign in' : 'Email me a link'}
          </button>
          {error && (
            <p className="text-[13px] text-fail" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[440px] px-5 pb-28 pt-16">
        <div className="panel p-7">
          <h1 className="h1">Sign in to Reps</h1>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </main>
  )
}
