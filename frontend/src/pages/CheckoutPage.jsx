import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Ticket from '../components/Ticket.jsx'
import UpiPay from '../components/UpiPay.jsx'
import UtrForm from '../components/UtrForm.jsx'
import PhonePrompt from '../components/PhonePrompt.jsx'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { recallPhone, rememberPhone } from '../lib/format.js'

function useCountdown(until) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return undefined
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [until])
  if (!until) return null
  const left = Math.max(0, new Date(until).getTime() - now)
  return { left, text: `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}` }
}

export default function CheckoutPage() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(() => recallPhone(ref))
  const booking = useAsync(() => (phone ? api.booking(ref, phone) : Promise.resolve(null)), [ref, phone])
  const countdown = useCountdown(booking.data?.holdExpiresAt)

  // Once a payment is recorded, or the booking ends, the ticket page takes over.
  useEffect(() => {
    if (booking.data && booking.data.status !== 'PENDING_PAYMENT') navigate(`/booking/${ref}`, { replace: true })
  }, [booking.data, navigate, ref])

  if (!phone || booking.error?.code === 'NOT_FOUND') {
    return (
      <div className="wrap page narrow">
        <h1 className="page-title">Pay for {ref}</h1>
        <PhonePrompt error={booking.error?.message} onSubmit={(p) => { rememberPhone(ref, p); setPhone(p) }} />
      </div>
    )
  }
  if (booking.error) return <div className="wrap page-message"><p className="error-text">{booking.error.message}</p></div>
  if (!booking.data) return <div className="wrap page"><p className="muted">Loading your booking…</p></div>

  const b = booking.data
  const expired = countdown && countdown.left === 0

  return (
    <div className="wrap page checkout">
      <h1 className="page-title">Pay to lock in your slot</h1>
      <div className={`hold-bar ${expired ? 'is-expired' : ''}`} role="status">
        {expired
          ? <>Your 15-minute hold has run out. <Link to="/">Book again</Link> if the slot is still free.</>
          : <>Slot held for <strong>{countdown?.text}</strong>. Pay and send your UTR before then.</>}
      </div>

      <div className="checkout-layout">
        <div className="checkout-pay">
          <h2 className="step-title">1. Pay with UPI</h2>
          <UpiPay upi={b.upi} amount={b.amount} bookingRef={b.ref} />
          <h2 className="step-title">2. Send your UTR</h2>
          <UtrForm bookingRef={b.ref} phone={phone} onSubmitted={() => navigate(`/booking/${b.ref}`)} />
        </div>
        <Ticket booking={b} />
      </div>
    </div>
  )
}
