import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client for the existing stefenewers.com project, using the
 * publishable key + the signed-in user's session. Row Level
 * Security limits every table to the user's own rows; there is no service-role
 * key anywhere in the client.
 */

let client: SupabaseClient | null | undefined

/** The browser key: the project's publishable key (or a legacy anon key). Never a secret key. */
export function publicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey())
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = publicKey()
  client = url && key ? createClient(url, key, {
        // A distinct storage key so a Reps session never collides with the site's own.
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'reps-auth' },
      }) : null
  return client
}

/** Bearer token for our own API routes (AI endpoints check it server-side). */
export async function accessToken(): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session?.access_token ?? null
}
