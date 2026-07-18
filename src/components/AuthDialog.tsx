import { useState } from 'react'
import { signInWithEmail, signInWithGoogle } from '../lib/auth'

/**
 * Sign-in dialog — passwordless email magic-link (+ Google).
 *
 * No passwords to remember: you enter an email, Supabase sends a one-time link,
 * and clicking it signs you in. Signing in syncs your lexicon across devices and
 * lets you publish words to the shared dictionary. Purely optional — the app works
 * fully as a guest.
 */
export function AuthDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || status === 'sending') return
    setStatus('sending')
    const err = await signInWithEmail(email)
    if (err) {
      setError(err)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Sign in</h3>
        {status === 'sent' ? (
          <>
            <p className="modal-body">
              Check <b>{email}</b> — we’ve sent a one-time sign-in link. Open it on this device
              to finish.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-body">
              Signing in syncs your lexicon across devices and lets you publish words to the
              shared dictionary. No password — we email you a one-time link.
            </p>
            <form onSubmit={submit}>
              <input
                type="email"
                className="auth-email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              {status === 'error' && <p className="auth-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Email me a link'}
                </button>
              </div>
            </form>
            <button type="button" className="auth-google" onClick={() => void signInWithGoogle()}>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  )
}
