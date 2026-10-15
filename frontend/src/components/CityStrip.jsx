import { Link } from 'react-router-dom'
import { saveCity } from '../lib/format.js'

/** Cities as a big uppercase index, Maharashtra first because that's where most grounds are. */
export default function CityStrip({ cities }) {
  const home = cities.filter((c) => c.state === 'Maharashtra')
  const rest = cities.filter((c) => c.state !== 'Maharashtra')

  const group = (title, list) => (
    <div className="city-group">
      <p className="label">{title}</p>
      <ul className="city-list">
        {list.map((c) => (
          <li key={c.slug}>
            <Link to={`/${c.slug}`} onClick={() => saveCity(c.slug)}>
              <span className="city-name">{c.name}</span>
              <span className="city-count">{c.venueCount} {c.venueCount === 1 ? 'ground' : 'grounds'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section className="section" aria-labelledby="cities-title">
      <div className="wrap editorial">
        <p className="label">Cities</p>
        <div>
          <h2 id="cities-title" className="section-title">Find a ground near you</h2>
          <div className="city-groups">
            {group('Maharashtra', home)}
            {group('Across India', rest)}
          </div>
        </div>
      </div>
    </section>
  )
}
