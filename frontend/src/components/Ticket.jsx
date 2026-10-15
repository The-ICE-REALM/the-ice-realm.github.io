import { formatRupees, longDate } from '../lib/format.js'

const STATUS = {
  PENDING_PAYMENT: { label: 'Waiting for payment', tone: 'wait' },
  PAYMENT_SUBMITTED: { label: 'Checking your payment', tone: 'wait' },
  CONFIRMED: { label: 'Confirmed', tone: 'ok' },
  CANCELLED: { label: 'Cancelled', tone: 'off' },
  EXPIRED: { label: 'Hold expired', tone: 'off' },
}

/** The booking as a match ticket: what, where, when, and its status. */
export default function Ticket({ booking }) {
  const status = STATUS[booking.status] ?? { label: booking.status, tone: 'wait' }
  return (
    <article className={`ticket ticket-${status.tone}`} aria-label={`Booking ${booking.ref}`}>
      <header className="ticket-head">
        <span className="ticket-status">{status.label}</span>
        <span className="ticket-ref">{booking.ref}</span>
      </header>
      <div className="ticket-body">
        <p className="ticket-time">{booking.timeLabel}</p>
        <p className="ticket-date">{longDate(booking.date)}</p>
        <p className="ticket-venue">{booking.venueName}</p>
        <p className="muted">{booking.turfName} turf · {booking.format} · {booking.area}, {booking.cityName}</p>
      </div>
      <footer className="ticket-foot">
        <span>{booking.customerName} · {booking.phoneMasked}</span>
        <span className="ticket-amount">{formatRupees(booking.amount)}</span>
      </footer>
    </article>
  )
}
