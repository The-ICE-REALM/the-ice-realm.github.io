import { useState } from 'react'
import { api } from '../lib/api.js'

/** Collects the 12-digit UTR after the player pays, so staff can match the payment. */
export default function UtrForm({ bookingRef, phone, onSubmitted }) {
  const [utr, setUtr] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onSubmitted(await api.submitUtr(bookingRef, phone, utr.trim()))
    } catch (err) {
      setError(err.fieldErrors?.utr ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="utr-form" onSubmit={submit} noValidate>
      <label className="field">
        <span>UTR number</span>
        <input inputMode="numeric" autoComplete="off" maxLength={12} placeholder="12 digits from your GPay receipt"
          value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
          aria-invalid={Boolean(error)} aria-describedby="utr-help" />
      </label>
      <p id="utr-help" className={error ? 'error-text' : 'muted small'}>
        {error ?? 'In GPay, open the payment and look for "UPI transaction ID".'}
      </p>
      <button className="btn btn-secondary" type="submit" disabled={busy || utr.length !== 12}>
        {busy ? 'Sending…' : 'I have paid, send UTR'}
      </button>
    </form>
  )
}
