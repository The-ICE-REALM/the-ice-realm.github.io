import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FORMATS } from '../components/HeroBooking.jsx'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { formatRupees, longDate, saveCity } from '../lib/format.js'

export default function CityPage() {
  const { city } = useParams()
  const [params, setParams] = useSearchParams()
  const format = params.get('format') ?? ''
  const date = params.get('date')
  const venues = useAsync(() => api.venues(city), [city])
  const cities = useAsync(() => api.cities(), [])
  const cityName = cities.data?.find((c) => c.slug === city)?.name ?? venues.data?.[0]?.cityName ?? ''

  useEffect(() => {
    if (venues.data) saveCity(city)
  }, [city, venues.data])

  useEffect(() => {
    if (cityName) document.title = `Football turfs in ${cityName} · Ice Realm`
  }, [cityName])

  const setFormat = (f) => {
    const next = new URLSearchParams(params)
    if (f) next.set('format', f)
    else next.delete('format')
    setParams(next, { replace: true })
  }

  if (venues.error) {
    return (
      <div className="wrap page-message">
        <h1>No grounds here yet</h1>
        <p>{venues.error.message} Pick one of our cities instead.</p>
        <Link className="btn btn-secondary" to="/">See all cities</Link>
      </div>
    )
  }

  const shown = (venues.data ?? []).filter((v) => !format || v.turfs.some((t) => t.format === format))
  const keep = params.toString() ? `?${params}` : ''

  return (
    <div className="wrap page">
      <nav className="city-tabs" aria-label="Cities">
        {cities.data?.map((c) => (
          <Link key={c.slug} to={`/${c.slug}${keep}`} aria-current={c.slug === city ? 'page' : undefined}>{c.name}</Link>
        ))}
      </nav>

      <h1 className="page-title">Grounds in {cityName}</h1>
      {date && <p className="muted">Showing grounds for {longDate(date)}</p>}

      <div className="filter-chips" role="group" aria-label="Format">
        {['', ...FORMATS].map((f) => (
          <button key={f || 'any'} type="button" aria-pressed={format === f} onClick={() => setFormat(f)}>
            {f || 'Any format'}
          </button>
        ))}
      </div>

      {venues.loading && <p className="muted">Loading grounds…</p>}
      {venues.data && shown.length === 0 && (
        <p className="muted">No {format} turfs in {cityName} yet. <button type="button" className="link-button" onClick={() => setFormat('')}>Show every format</button></p>
      )}

      <ul className="venue-list">
        {shown.map((v) => {
          const turfs = format ? v.turfs.filter((t) => t.format === format) : v.turfs
          const from = Math.min(...turfs.map((t) => t.fromPrice))
          const link = `/venue/${v.id}?${new URLSearchParams({ turf: turfs[0].id, ...(date ? { date } : {}) })}`
          return (
            <li key={v.id} className="venue-card">
              <div className="venue-card-main">
                <p className="venue-card-area">{v.area}</p>
                <h2><Link to={link}>{v.name}</Link></h2>
                <ul className="chip-row">
                  {v.turfs.map((t) => <li key={t.id} className="chip">{t.name} · {t.format}</li>)}
                </ul>
                <p className="venue-amenities">{v.amenities.join(', ')}</p>
              </div>
              <div className="venue-card-cta">
                <p className="venue-card-price"><span className="muted">From</span> <strong>{formatRupees(from)}</strong><span className="muted">/hr</span></p>
                <Link className="btn btn-primary" to={link}>See open slots</Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
