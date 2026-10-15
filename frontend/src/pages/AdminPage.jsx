import { useState } from 'react'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { formatRupees, longDate } from '../lib/format.js'

const TOKEN_KEY = 'iceRealm.adminToken'
const readToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

const TABS = [
  { status: 'PAYMENT_SUBMITTED', label: 'To verify' },
  { status: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { status: 'CONFIRMED', label: 'Confirmed' },
]

/** Staff screen: match UTRs against the bank statement, then confirm or reject. */
export default function AdminPage() {
  const [token, setToken] = useState(readToken)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('PAYMENT_SUBMITTED')
  const [actionError, setActionError] = useState(null)
  const list = useAsync(() => (token ? api.adminBookings(token, status) : Promise.resolve([])), [token, status])

  const signIn = (e) => {
    e.preventDefault()
    try { sessionStorage.setItem(TOKEN_KEY, draft) } catch { /* session only */ }
    setToken(draft)
  }

  if (!token || list.error?.code === 'ADMIN_ACCESS_DENIED') {
    return (
      <div className="wrap page narrow">
        <h1 className="page-title">Staff sign-in</h1>
        <form className="phone-prompt" onSubmit={signIn}>
          <label className="field">
            <span>Staff code</span>
            <input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="current-password" />
          </label>
          {list.error && <p className="error-text">{list.error.message}</p>}
          <button className="btn btn-secondary" type="submit" disabled={!draft}>Sign in</button>
        </form>
      </div>
    )
  }

  const act = async (fn, ref) => {
    setActionError(null)
    try {
      await fn(token, ref)
      list.reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div className="wrap page">
      <h1 className="page-title">Payments</h1>
      <div className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.status} role="tab" aria-selected={status === t.status} onClick={() => setStatus(t.status)}>
            {t.label}
          </button>
        ))}
      </div>
      {actionError && <p className="error-text" role="alert">{actionError}</p>}
      {list.loading && <p className="muted">Loading…</p>}
      {list.data?.length === 0 && <p className="muted">Nothing here right now.</p>}
      {list.data?.length > 0 && (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>Ref</th><th>Slot</th><th>Ground</th><th>Player</th><th>Amount</th><th>UTR</th><th /></tr>
            </thead>
            <tbody>
              {list.data.map((b) => (
                <tr key={b.ref}>
                  <td className="mono">{b.ref}</td>
                  <td>{longDate(b.date)}<br />{b.timeLabel}</td>
                  <td>{b.venueName}<br /><span className="muted">{b.turfName}</span></td>
                  <td>{b.customerName}<br /><span className="muted">{b.phoneMasked}</span></td>
                  <td>{formatRupees(b.amount)}</td>
                  <td className="mono">{b.utr ?? '—'}</td>
                  <td className="admin-actions">
                    {b.status === 'PAYMENT_SUBMITTED' && (
                      <button className="btn btn-primary btn-small" onClick={() => act(api.adminConfirm, b.ref)}>Confirm</button>
                    )}
                    {b.status !== 'CONFIRMED' && (
                      <button className="btn btn-ghost btn-small" onClick={() => act(api.adminReject, b.ref)}>Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
