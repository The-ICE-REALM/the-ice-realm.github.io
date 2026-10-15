import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DayPicker from '../components/DayPicker.jsx'
import SlotGrid from '../components/SlotGrid.jsx'
import { FrostStar } from '../components/Logo.jsx'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { useMediaQuery } from '../lib/useMediaQuery.js'
import { formatRupees, isoDate, longDate, parseIsoDate, rememberPhone } from '../lib/format.js'

export default function VenuePage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const venue = useAsync(() => api.venue(id), [id])
  const isDesktop = useMediaQuery('(min-width: 960px)')

  const [turfId, setTurfId] = useState(params.get('turf') ? Number(params.get('turf')) : null)
  const [date, setDate] = useState(params.get('date') ?? isoDate(new Date()))
  const [startHour, setStartHour] = useState(params.get('hour') ? Number(params.get('hour')) : null)
  const [hours, setHours] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeTurf = venue.data?.turfs.find((t) => t.id === turfId) ?? venue.data?.turfs[0]
  const slots = useAsync(() => (activeTurf ? api.slots(activeTurf.id, date) : Promise.resolve([])), [activeTurf?.id, date])

  useEffect(() => {
    if (venue.data) document.title = `${venue.data.name} · Ice Realm`
  }, [venue.data])

  // Drop a selection that's no longer bookable after changing turf, day or length.
  useEffect(() => {
    if (startHour == null || !slots.data) return
    const ok = Array.from({ length: hours }, (_, i) => slots.data.find((s) => s.hour === startHour + i))
      .every((s) => s?.available)
    if (!ok) setStartHour(null)
  }, [slots.data, hours]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = startHour != null && slots.data
    ? slots.data.filter((s) => s.hour >= startHour && s.hour < startHour + hours)
    : []
  const ready = startHour != null && selected.length === hours
  const total = selected.reduce((sum, s) => sum + s.price, 0)
  const timeLabel = !ready ? ''
    : selected.length === 1 ? selected[0].label
      : `${selected[0].label.split('–')[0]}–${selected[selected.length - 1].label.split('–')[1]}`

  if (venue.error) {
    return (
      <div className="wrap page-message">
        <h1>Ground not found</h1>
        <p>{venue.error.message}</p>
        <Link className="btn btn-secondary" to="/">Back to all grounds</Link>
      </div>
    )
  }
  if (!venue.data) return <div className="wrap page"><p className="muted">Loading ground…</p></div>

  const v = venue.data
  const form = ready && (
    <BookingForm venue={v} turf={activeTurf} date={date} hours={hours} startHour={startHour} total={total}
      timeLabel={timeLabel}
      onBooked={(booking, phone) => {
        rememberPhone(booking.ref, phone)
        navigate(`/checkout/${booking.ref}`)
      }}
      onConflict={() => { setStartHour(null); setSheetOpen(false); slots.reload() }} />
  )

  return (
    <div className="wrap page venue-page">
      <p className="breadcrumb"><Link to={`/${v.citySlug}`}>{v.cityName}</Link> / {v.area}</p>
      <h1 className="page-title">{v.name}</h1>
      <p className="muted">{v.address} · <a href={v.mapsUrl} target="_blank" rel="noreferrer">Directions</a></p>

      <div className="venue-layout">
        <div className="venue-picker">
          <section aria-labelledby="turf-title">
            <h2 id="turf-title" className="step-title">Turf</h2>
            <div className="turf-options" role="radiogroup" aria-labelledby="turf-title">
              {v.turfs.map((t) => (
                <label key={t.id} className={`turf-card ${activeTurf?.id === t.id ? 'is-selected' : ''}`}>
                  <input type="radio" name="turf" checked={activeTurf?.id === t.id}
                    onChange={() => { setTurfId(t.id); setStartHour(null) }} />
                  <span className="turf-card-top">
                    <FrostStar size={18} className="turf-card-star" />
                    <span className="chip">{t.format}</span>
                  </span>
                  <span className="turf-card-name">{t.name}</span>
                  <span className="turf-card-meta">{t.capacity} players · {t.dimensions}</span>
                  <span className="turf-card-price">From {formatRupees(t.fromPrice)}/hr</span>
                </label>
              ))}
            </div>
          </section>

          <section aria-labelledby="day-title">
            <h2 id="day-title" className="step-title">Day</h2>
            <DayPicker value={date} onChange={(d) => { setDate(d); setStartHour(null) }} />
          </section>

          <section aria-labelledby="time-title">
            <div className="step-head">
              <h2 id="time-title" className="step-title">Start time</h2>
              <label className="field field-inline">
                <span>Play for</span>
                <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                </select>
              </label>
            </div>
            {slots.loading && <p className="muted">Checking slots…</p>}
            {slots.error && <p className="error-text">{slots.error.message}</p>}
            {slots.data && <SlotGrid slots={slots.data} startHour={startHour} hours={hours} onSelect={setStartHour} />}
          </section>
        </div>

        {isDesktop && (
          <aside className="booking-aside">
            {form || (
              <div className="summary-card summary-card-empty">
                <div className="summary-head"><span>Your slot</span></div>
                <div className="summary-body">
                  <p className="summary-empty-title">Pick a start time</p>
                  <p className="muted">Choose a free slot to see the total and book it.</p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {!isDesktop && ready && (
        <>
          <div className="summary-bar" role="region" aria-label="Selected slot">
            <div className="summary-bar-text">
              <span className="summary-bar-when">
                {parseIsoDate(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, {timeLabel}
              </span>
              <strong>{formatRupees(total)}</strong>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setSheetOpen(true)}>Continue</button>
          </div>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} label={`Book ${timeLabel}`}>{form}</Sheet>
        </>
      )}
    </div>
  )
}

/** Bottom-sheet modal built on <dialog>: native focus trap, Esc to close, focus returns on close. */
function Sheet({ open, onClose, label, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="sheet" aria-label={label} onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}>
      <div className="sheet-inner">
        <div className="sheet-grip" aria-hidden="true" />
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </dialog>
  )
}

function BookingForm({ venue, turf, date, startHour, hours, total, timeLabel, onBooked, onConflict }) {
  const [form, setForm] = useState({ customerName: '', phone: '', email: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setMessage(null)
    try {
      const booking = await api.createBooking({ turfId: turf.id, date, startHour, hours, ...form, email: form.email || null })
      onBooked(booking, form.phone)
    } catch (err) {
      setErrors(err.fieldErrors ?? {})
      setMessage(err.message)
      if (err.code === 'SLOT_ALREADY_BOOKED') onConflict()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="summary-card booking-form" onSubmit={submit} noValidate>
      <div className="summary-head">
        <span className="summary-time">{timeLabel}</span>
        <span className="chip">{turf.format}</span>
      </div>
      <div className="summary-body">
        <p className="summary-where">{longDate(date)}<br /><span className="muted">{turf.name} turf, {venue.name}</span></p>

        <label className="field">
          <span>Your name</span>
          <input autoComplete="name" value={form.customerName} onChange={set('customerName')} aria-invalid={Boolean(errors.customerName)} />
          {errors.customerName && <small className="error-text">{errors.customerName}</small>}
        </label>
        <label className="field">
          <span>Mobile number</span>
          <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10 digits"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
            aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <small className="error-text">{errors.phone}</small>}
        </label>
        <label className="field">
          <span>Email <span className="muted">(optional)</span></span>
          <input type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
          {errors.email && <small className="error-text">{errors.email}</small>}
        </label>

        {message && <p className="error-text" role="alert">{message}</p>}

        <div className="booking-total">
          <span>Total for {hours} {hours === 1 ? 'hour' : 'hours'}</span>
          <strong>{formatRupees(total)}</strong>
        </div>
        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
          {busy ? 'Holding your slot…' : `Book ${timeLabel} for ${formatRupees(total)}`}
        </button>
        <p className="muted small summary-note">We hold the slot for 15 minutes while you pay with UPI.</p>
      </div>
    </form>
  )
}
