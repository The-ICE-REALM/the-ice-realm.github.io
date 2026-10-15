import { upcomingDays } from '../lib/format.js'

/** Horizontal strip of the next 14 days. */
export default function DayPicker({ value, onChange, count = 14, label = 'Day' }) {
  const days = upcomingDays(count)
  return (
    <fieldset className="day-picker">
      <legend className="visually-hidden">{label}</legend>
      <div className="day-scroll">
        {days.map((d) => (
          <label key={d.iso} className={`day ${value === d.iso ? 'is-selected' : ''}`}>
            <input type="radio" name="day" value={d.iso} checked={value === d.iso} onChange={() => onChange(d.iso)} />
            <span className="day-week">{d.weekday}</span>
            <span className="day-date">{d.day}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
