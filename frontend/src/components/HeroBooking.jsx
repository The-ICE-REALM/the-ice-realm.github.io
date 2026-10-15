import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Roll from './Roll.jsx'
import logo from '../assets/brand/ice-realm-logo.webp'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { formatRupees, isoDate, saveCity, savedCity, upcomingDays } from '../lib/format.js'

export const FORMATS = ['5-a-side', '7-a-side', 'Futsal']

/**
 * Home hero: a full-width uppercase headline with the crystal logo floating behind it,
 * a search console docked underneath, and a strip of the soonest open slots.
 */
export default function HeroBooking({ cities }) {
  const navigate = useNavigate()
  const [city, setCity] = useState(savedCity)
  const [format, setFormat] = useState('')
  const [date, setDate] = useState(() => isoDate(new Date()))
  const days = upcomingDays(14)
  const slots = useAsync(() => api.openSlots(city, date, 12), [city, date])
  const cityName = cities.find((c) => c.slug === city)?.name ?? ''
  const cityCount = cities.length || 10
  const matches = (slots.data ?? []).filter((s) => !format || s.format === format).slice(0, 6)

  const chooseCity = (slug) => {
    setCity(slug)
    saveCity(slug)
  }

  const search = (e) => {
    e.preventDefault()
    const params = new URLSearchParams({ date, ...(format ? { format } : {}) })
    navigate(`/${city}?${params}`)
  }

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <img className="hero-logo" src={logo} alt="" width="960" height="960" />
        <h1 id="hero-title" className="hero-headline" aria-label={`Book floodlit football on the ice in ${cityCount} cities, tonight`}>
          <span className="hero-row" aria-hidden="true"><span>Book</span><span>floodlit</span></span>
          <span className="hero-row" aria-hidden="true"><span>football</span><mark>on the ice</mark></span>
          <span className="hero-row" aria-hidden="true"><span>in {cityCount} cities,</span><mark>tonight</mark></span>
        </h1>
      </div>

      <div className="wrap">
        <form className="console" id="book" onSubmit={search} aria-label="Find a slot">
          <label className="console-field">
            <span className="label">City</span>
            <select value={city} onChange={(e) => chooseCity(e.target.value)}>
              {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="console-field">
            <span className="label">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="">Any format</option>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="console-field">
            <span className="label">Day</span>
            <select value={date} onChange={(e) => setDate(e.target.value)}>
              {days.map((d) => <option key={d.iso} value={d.iso}>{d.weekday}, {d.day}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn-primary console-submit roll-host"><Roll>Find slots</Roll></button>
        </form>

        <div className="soonest editorial" aria-live="polite">
          <p className="label">{slots.loading ? 'Checking the grounds…' : `Soonest open in ${cityName}`}</p>
          <div className="soonest-body">
            {slots.error && <p className="error-text">{slots.error.message}</p>}
            {slots.data && matches.length === 0 && (
              <p className="muted">
                No {format || 'open'} slots left in {cityName} for this day. Try another day{format ? ' or any format' : ''}.
              </p>
            )}
            {matches.length > 0 && (
              <ul className="open-slot-list">
                {matches.map((s) => (
                  <li key={`${s.turfId}-${s.hour}`}>
                    <Link className="open-slot" to={`/venue/${s.venueId}?turf=${s.turfId}&date=${s.date}&hour=${s.hour}`}>
                      <span className="open-slot-time">{s.label}</span>
                      <span className="open-slot-where">{s.area}</span>
                      <span className="open-slot-foot">
                        <span className="chip">{s.format}</span>
                        <span className="open-slot-price">{formatRupees(s.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
