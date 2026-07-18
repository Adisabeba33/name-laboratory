import type { SupabaseClient, Session } from '@supabase/supabase-js'

/**
 * Authentication — the front door to accounts and the shared dictionary.
 *
 * Backed by Supabase Auth. It is entirely OPTIONAL: with no Supabase env vars the
 * app runs exactly as before — a guest whose lexicon lives in localStorage. When
 * the keys are present, users can sign in (email magic-link, later Google) and
 * their lexicon syncs to the cloud. The anon key is safe in the browser because
 * every table is guarded by row-level security; the service key stays server-side.
 *
 * The supabase-js SDK is loaded LAZILY (dynamic import) only when auth is actually
 * configured, so a guest never downloads ~200 KB of client they'll never use.
 */

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when Supabase is configured — otherwise the app stays in guest mode. */
export function isAuthConfigured(): boolean {
  return Boolean(URL && ANON)
}

/** A minimal user shape the UI needs (Supabase's User is much larger). */
export interface AuthUser {
  id: string
  email: string | null
}

let clientPromise: Promise<SupabaseClient | null> | null = null

/** Lazily import supabase-js and create the client — null when not configured. */
function loadClient(): Promise<SupabaseClient | null> {
  if (!isAuthConfigured()) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL as string, ANON as string, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }),
    )
  }
  return clientPromise
}

function toUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null
  return { id: session.user.id, email: session.user.email ?? null }
}

/** The current signed-in user, or null (guest / not configured). */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const c = await loadClient()
  if (!c) return null
  const { data } = await c.auth.getSession()
  return toUser(data.session)
}

/** The access token for the current session, for authenticating `/api` calls. */
export async function getAccessToken(): Promise<string | null> {
  const c = await loadClient()
  if (!c) return null
  const { data } = await c.auth.getSession()
  return data.session?.access_token ?? null
}

/** Send a passwordless magic-link to `email`. Returns an error message, or null. */
export async function signInWithEmail(email: string): Promise<string | null> {
  const c = await loadClient()
  if (!c) return 'Sign-in is not configured.'
  const { error } = await c.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })
  return error ? error.message : null
}

/** Begin Google OAuth (redirect flow). Returns an error message, or null. */
export async function signInWithGoogle(): Promise<string | null> {
  const c = await loadClient()
  if (!c) return 'Sign-in is not configured.'
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  return error ? error.message : null
}

export async function signOut(): Promise<void> {
  const c = await loadClient()
  await c?.auth.signOut()
}

/**
 * Subscribe to sign-in / sign-out. Fires with the current user once ready, then on
 * every change. Returns an unsubscribe function (a no-op when not configured).
 */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!isAuthConfigured()) {
    cb(null)
    return () => {}
  }
  let active = true
  let unsub = () => {}
  void loadClient().then((c) => {
    if (!c || !active) return
    void c.auth.getSession().then(({ data }) => {
      if (active) cb(toUser(data.session))
    })
    const { data } = c.auth.onAuthStateChange((_event, session) => cb(toUser(session)))
    unsub = () => data.subscription.unsubscribe()
  })
  return () => {
    active = false
    unsub()
  }
}
