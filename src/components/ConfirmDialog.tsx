import { useState } from 'react'

/**
 * Confirmation gate for AI (LLM) requests.
 *
 * Every call to the language model costs money, so the app never reaches the LLM
 * silently: this dialog states plainly that an AI request is about to happen and
 * asks permission. Declining keeps the app on its free, built-in engine. An
 * opt-out ("don't ask again this session") is offered so power users aren't
 * nagged, but the default is always to ask.
 */
export function ConfirmDialog({
  message,
  onAllow,
  onCancel,
}: {
  message: string
  onAllow: (remember: boolean) => void
  onCancel: () => void
}) {
  const [remember, setRemember] = useState(false)
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">AI request</h3>
        <p className="modal-body">{message}</p>
        <p className="modal-note">
          This calls the language model — a paid request. Without it, the laboratory still
          works on its built-in engine, for free.
        </p>
        <label className="modal-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Don’t ask again this session
        </label>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={() => onAllow(remember)}>
            Allow AI request
          </button>
        </div>
      </div>
    </div>
  )
}
