import { formatRupees } from '../lib/format.js'

/**
 * Hourly slots for one turf on one day. Selecting a slot starts a run of
 * `hours` consecutive hours; a start is only offered when the whole run is free.
 * A selected run is drawn as one connected bar (start / mid / end tiles).
 */
export default function SlotGrid({ slots, startHour, hours, onSelect }) {
  const byHour = new Map(slots.map((s) => [s.hour, s]))
  const runIsFree = (start) => {
    for (let h = start; h < start + hours; h++) {
      if (!byHour.get(h)?.available) return false
    }
    return true
  }
  const anyFree = slots.some((s) => runIsFree(s.hour))

  const runClass = (h) => {
    if (startHour == null || h < startHour || h >= startHour + hours) return ''
    if (hours === 1) return 'is-selected'
    if (h === startHour) return 'is-selected is-run-start'
    if (h === startHour + hours - 1) return 'is-selected is-run-end'
    return 'is-selected is-run-mid'
  }

  return (
    <div>
      <ul className="slot-legend" aria-label="Key">
        <li><span className="swatch swatch-open" />Open</li>
        <li><span className="swatch swatch-peak" />Evening and weekend rate</li>
        <li><span className="swatch swatch-booked" />Booked</li>
      </ul>
      {!anyFree && (
        <p className="muted">No {hours > 1 ? `${hours}-hour runs` : 'slots'} left on this turf for this day. Try another day or turf.</p>
      )}
      <ul className="slot-grid" aria-label="Start time">
        {slots.map((s) => {
          const selected = runClass(s.hour)
          const peak = s.band === 'Peak' || s.band === 'Weekend'
          const state = s.available ? '' : s.started ? 'is-passed' : 'is-booked'
          return (
            <li key={s.hour}>
              <button type="button"
                className={`slot ${selected} ${peak ? 'is-peak' : ''} ${state}`}
                disabled={!runIsFree(s.hour) && !selected}
                aria-pressed={s.hour === startHour}
                onClick={() => onSelect(s.hour)}>
                <span className="slot-time">{s.label}</span>
                <span className="slot-price">{s.available ? formatRupees(s.price) : s.started ? 'Passed' : 'Booked'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="slot-note muted small">Prices are per hour and include GST.</p>
    </div>
  )
}
