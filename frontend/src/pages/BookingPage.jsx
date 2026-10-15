import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Ticket from '../components/Ticket.jsx'
import PhonePrompt from '../components/PhonePrompt.jsx'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { recallPhone, rememberPhone } from '../lib/format.js'

const NEXT_STEP = {
  PENDING_PAYMENT: 'Your slot is held but not paid for yet.',
  PAYMENT_SUBMITTED: "We've got your UTR and are matching it with the payment. This page updates on its own, usually within a few minutes.",
  CONFIRMED: 'Show this ticket at the front desk. Arrive 10 minutes early to change and warm up.',
  CANCELLED: "This booking was cancelled because we couldn't match the payment. If money left your account, call the ground with your UTR.",
  EXPIRED: 'The 15-minute hold ran out before a payment was sent, so the slot was released.',
}

export default function BookingPage() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(() => (ref ? recallPhone(ref) : ''))
  const booking = useAsync(() => (ref && phone ? api.booking(ref, phone) : Promise.resolve(null)), [ref, phone])

  // Poll while staff are checking the payment.
  const waiting = booking.data?.status === 'PAYMENT_SUBMITTED'
  const { reload } = booking
  useEffect(() => {
    if (!waiting) return undefined
    const t = setInterval(reload, 15000)
    return () => clearInterval(t)
  }, [waiting, reload])

  if (!ref || !phone || booking.error?.code === 'NOT_FOUND') {
    return (
      <div className="wrap page narrow">
        <h1 className="page-title">Find your booking</h1>
        <PhonePrompt withRef={!ref} initialRef={ref ?? ''} error={booking.error?.message}
          onSubmit={(p, r) => {
            const target = ref ?? r
            rememberPhone(target, p)
            if (ref) setPhone(p)
            else navigate(`/booking/${target}`)
          }} />
      </div>
    )
  }
  if (booking.error) return <div className="wrap page-message"><p className="error-text">{booking.error.message}</p></div>
  if (!booking.data) return <div className="wrap page"><p className="muted">Loading your booking…</p></div>

  const b = booking.data
  return (
    <div className="wrap page narrow">
      <h1 className="page-title">{b.status === 'CONFIRMED' ? "You're on the pitch" : 'Your booking'}</h1>
      <Ticket booking={b} />
      <p className="next-step">{NEXT_STEP[b.status]}</p>
      <div className="button-row">
        {b.status === 'PENDING_PAYMENT' && <Link className="btn btn-primary" to={`/checkout/${b.ref}`}>Pay now</Link>}
        {(b.status === 'EXPIRED' || b.status === 'CANCELLED') && <Link className="btn btn-primary" to="/">Book another slot</Link>}
        {b.status === 'CONFIRMED' && <Link className="btn btn-secondary" to="/">Book another game</Link>}
      </div>
    </div>
  )
}
