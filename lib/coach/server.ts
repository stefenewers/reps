import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { z } from 'zod'

/**
 * Server side of the adaptive coach: access control, model routing, and one
 * small JSON-mode call per request. API keys never leave the server.
 */

// ── access ───────────────────────────────────────────────────────────────────

/**
 * Coach routes spend money, so they require the signed-in Reps owner (the same
 * check RLS uses: public.reps_is_owner()). For local development without
 * Supabase, REPS_ALLOW_UNAUTHENTICATED_AI=1 opts out, never in production.
 */
export async function authorize(req: Request): Promise<Response | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const bypass = process.env.REPS_ALLOW_UNAUTHENTICATED_AI === '1' && process.env.NODE_ENV !== 'production'
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!token || !url || !key) return bypass ? null : json({ error: 'Sign in to use the coach.' }, 401)
  const sb = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
  const { data, error } = await sb.rpc('reps_is_owner')
  if (error || data !== true) return bypass ? null : json({ error: 'Not allowed.' }, 403)
  return null
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

// ── models ───────────────────────────────────────────────────────────────────

export type Tier = 'fast' | 'reasoning'

export function modelFor(tier: Tier): string {
  return tier === 'reasoning' ? process.env.OPENAI_REASONING_MODEL || 'gpt-5' : process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-mini'
}

/** The shared rules, kept short on purpose. */
export const TEACHING_RULES = [
  'You support a learner preparing for a Google SWE internship interview in Python.',
  'Be concise. No praise, no filler. Never reveal a full solution unless asked.',
  'Stay inside the given skills. Prefer retrieval over explanation.',
  'Distinguish Python recall problems from algorithm problems.',
  'Deterministic tests decide correctness, not you. Never invent Python behavior.',
  'Reply with JSON only, matching the requested shape.',
].join(' ')

export class CoachUnavailable extends Error {}

interface CallOptions<T> {
  tier: Tier
  system: string
  user: string
  schema: z.ZodType<T>
  maxTokens: number
}

/**
 * One chat-completions call in JSON mode, validated with Zod. Output limits
 * are conservative; reasoning models get a little headroom for their thinking.
 */
export async function callModel<T>({ tier, system, user, schema, maxTokens }: CallOptions<T>): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new CoachUnavailable('The coach is not configured (OPENAI_API_KEY is missing).')
  const body: Record<string, unknown> = {
    model: modelFor(tier),
    messages: [
      { role: 'system', content: `${TEACHING_RULES}\n${system}` },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: maxTokens,
    reasoning_effort: tier === 'reasoning' ? 'medium' : 'low',
  }

  let res = await post(apiKey, body)
  if (res.status === 400) {
    // Non-reasoning models reject reasoning_effort; retry once without it.
    const text = await res.clone().text()
    if (/reasoning_effort|reasoning/i.test(text)) {
      delete body.reasoning_effort
      res = await post(apiKey, body)
    }
  }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    throw new Error(`model request failed (${res.status}): ${detail}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('empty model response')
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('model returned invalid JSON')
  }
  return schema.parse(parsed)
}

function post(apiKey: string, body: unknown) {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
}

/** Uniform route wrapper: auth, parse, call, errors as JSON. */
export async function handle<I>(req: Request, input: z.ZodType<I>, fn: (body: I) => Promise<unknown>): Promise<Response> {
  const denied = await authorize(req)
  if (denied) return denied
  let body: I
  try {
    body = input.parse(await req.json())
  } catch (e) {
    return json({ error: `Bad request: ${(e as Error).message.slice(0, 200)}` }, 400)
  }
  try {
    return json(await fn(body))
  } catch (e) {
    if (e instanceof CoachUnavailable) return json({ error: e.message }, 503)
    return json({ error: (e as Error).message.slice(0, 300) }, 502)
  }
}
